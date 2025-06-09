import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductRow {
  nome: string;
  descricao?: string;
  categoria: string;
  precoOriginal: number;
  precoDesconto: number;
  quantidade: number;
  dataVencimento: string;
  imagemUrl?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const instructions = [
      {
        nome: 'INSTRUÇÕES DE PREENCHIMENTO',
        descricao: 'Apague esta linha e preencha os dados dos produtos abaixo',
        categoria: 'Data: formato DD/MM/AAAA ou AAAA-MM-DD',
        precoOriginal: 'Apenas números (ex: 25.90)',
        precoDesconto: 'Menor que preço original',
        quantidade: 'Números inteiros',
        dataVencimento: 'Data futura válida',
        imagemUrl: 'URL da imagem (opcional)'
      }
    ];

    const template = [
      {
        nome: 'Arroz Branco 5kg',
        descricao: 'Arroz branco tipo 1, grãos longos',
        categoria: 'Grãos e Cereais',
        precoOriginal: 25.90,
        precoDesconto: 22.90,
        quantidade: 50,
        dataVencimento: '31/12/2025',
        imagemUrl: 'https://exemplo.com/arroz.jpg'
      },
      {
        nome: 'Feijão Preto 1kg',
        descricao: 'Feijão preto tipo 1',
        categoria: 'Grãos e Cereais',
        precoOriginal: 8.50,
        precoDesconto: 7.90,
        quantidade: 30,
        dataVencimento: '15/01/2026',
        imagemUrl: ''
      },
      {
        nome: 'Leite Integral 1L',
        descricao: 'Leite integral pasteurizado',
        categoria: 'Laticínios',
        precoOriginal: 4.50,
        precoDesconto: 3.99,
        quantidade: 100,
        dataVencimento: '2025-07-20',
        imagemUrl: ''
      }
    ];

    const allData = [...instructions, ...template];
    const ws = XLSX.utils.json_to_sheet(allData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 20 }, // nome
      { wch: 30 }, // descricao
      { wch: 15 }, // categoria
      { wch: 12 }, // precoOriginal
      { wch: 12 }, // precoDesconto
      { wch: 10 }, // quantidade
      { wch: 15 }, // dataVencimento
      { wch: 25 }  // imagemUrl
    ];

    // Style the instruction row
    const instructionCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'];
    instructionCells.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
          font: { bold: true }
        };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'template_produtos_saveup.xlsx');
  };

  const validateProducts = (data: any[]): { products: ProductRow[], errors: ValidationError[] } => {
    const validProducts: ProductRow[] = [];
    const validationErrors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row (starting from 2, accounting for header)

      // Required fields validation
      if (!row.nome || row.nome.toString().trim() === '') {
        validationErrors.push({ row: rowNumber, field: 'nome', message: 'Nome é obrigatório' });
      }
      if (!row.categoria || row.categoria.toString().trim() === '') {
        validationErrors.push({ row: rowNumber, field: 'categoria', message: 'Categoria é obrigatória' });
      }
      if (!row.precoOriginal || isNaN(Number(row.precoOriginal))) {
        validationErrors.push({ row: rowNumber, field: 'precoOriginal', message: 'Preço original deve ser um número válido' });
      }
      if (!row.precoDesconto || isNaN(Number(row.precoDesconto))) {
        validationErrors.push({ row: rowNumber, field: 'precoDesconto', message: 'Preço desconto deve ser um número válido' });
      }
      if (!row.quantidade || isNaN(Number(row.quantidade))) {
        validationErrors.push({ row: rowNumber, field: 'quantidade', message: 'Quantidade deve ser um número válido' });
      }
      if (!row.dataVencimento) {
        validationErrors.push({ row: rowNumber, field: 'dataVencimento', message: 'Data de vencimento é obrigatória' });
      }

      // Price validation
      if (row.precoOriginal && row.precoDesconto && Number(row.precoDesconto) > Number(row.precoOriginal)) {
        validationErrors.push({ row: rowNumber, field: 'precoDesconto', message: 'Preço desconto não pode ser maior que preço original' });
      }

      // Date validation
      if (row.dataVencimento) {
        let dateValue = row.dataVencimento;
        let parsedDate: Date | null = null;
        
        // Handle Excel date serial numbers
        if (typeof dateValue === 'number') {
          // Excel stores dates as serial numbers starting from 1900-01-01
          const excelEpoch = new Date(1900, 0, 1);
          parsedDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
        } else {
          const dateStr = dateValue.toString().trim();
          
          // Try different date formats
          // Format DD/MM/YYYY or DD/MM/YY
          const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})$/;
          const ddmmMatch = dateStr.match(ddmmyyyyRegex);
          
          if (ddmmMatch) {
            const [, day, month, year] = ddmmMatch;
            let fullYear = parseInt(year);
            if (fullYear < 100) {
              fullYear += fullYear < 50 ? 2000 : 1900; // 50+ = 19xx, <50 = 20xx
            }
            parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
          } else {
            // Try ISO format (YYYY-MM-DD) or other standard formats
            parsedDate = new Date(dateStr);
          }
        }
        
        if (!parsedDate || isNaN(parsedDate.getTime())) {
          validationErrors.push({ row: rowNumber, field: 'dataVencimento', message: 'Data de vencimento inválida (use formato DD/MM/YYYY ou YYYY-MM-DD)' });
        } else {
          // Check if date is not in the past
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          parsedDate.setHours(0, 0, 0, 0);
          
          if (parsedDate < today) {
            validationErrors.push({ row: rowNumber, field: 'dataVencimento', message: 'Data de vencimento não pode estar no passado' });
          }
        }
      }

      // If no errors for this row, add to valid products
      const hasErrors = validationErrors.some(error => error.row === rowNumber);
      if (!hasErrors) {
        // Format date properly using the same parsing logic
        let formattedDate = '';
        let dateValue = row.dataVencimento;
        let parsedDate: Date | null = null;
        
        if (typeof dateValue === 'number') {
          // Convert Excel serial number to proper date
          const excelEpoch = new Date(1900, 0, 1);
          parsedDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
        } else {
          const dateStr = dateValue.toString().trim();
          
          // Try DD/MM/YYYY format first
          const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})$/;
          const ddmmMatch = dateStr.match(ddmmyyyyRegex);
          
          if (ddmmMatch) {
            const [, day, month, year] = ddmmMatch;
            let fullYear = parseInt(year);
            if (fullYear < 100) {
              fullYear += fullYear < 50 ? 2000 : 1900;
            }
            parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
          } else {
            parsedDate = new Date(dateStr);
          }
        }
        
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        }

        validProducts.push({
          nome: row.nome.toString().trim(),
          descricao: row.descricao ? row.descricao.toString().trim() : '',
          categoria: row.categoria.toString().trim(),
          precoOriginal: Number(row.precoOriginal),
          precoDesconto: Number(row.precoDesconto),
          quantidade: Number(row.quantidade),
          dataVencimento: formattedDate,
          imagemUrl: row.imagemUrl ? row.imagemUrl.toString().trim() : ''
        });
      }
    });

    return { products: validProducts, errors: validationErrors };
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setProducts([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo Excel não contém dados para importar.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const { products: validProducts, errors: validationErrors } = validateProducts(jsonData);
      
      setProducts(validProducts);
      setErrors(validationErrors);
      setStep('preview');
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível ler o arquivo Excel. Verifique se o formato está correto.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.includes('sheet')) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const importProducts = async () => {
    setIsUploading(true);
    setStep('importing');
    setProgress(0);

    try {
      const staffInfo = localStorage.getItem('staffInfo');
      if (!staffInfo) {
        throw new Error('Staff não autenticado');
      }

      const { id: staffId } = JSON.parse(staffInfo);
      let successCount = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        try {
          await apiRequest('POST', '/api/products', {
            name: product.nome,
            description: product.descricao,
            category: product.categoria,
            originalPrice: product.precoOriginal.toString(),
            discountPrice: product.precoDesconto.toString(),
            quantity: product.quantidade,
            expirationDate: product.dataVencimento,
            imageUrl: product.imagemUrl || null,
            createdByStaff: staffId
          });
          
          successCount++;
        } catch (error) {
          console.error(`Erro ao importar produto ${product.nome}:`, error);
        }

        setProgress(((i + 1) / products.length) * 100);
      }

      setStep('complete');
      toast({
        title: "Importação concluída",
        description: `${successCount} de ${products.length} produtos importados com sucesso.`,
      });

      // Call success callback to refresh products list
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação dos produtos.",
        variant: "destructive",
      });
    }

    setIsUploading(false);
  };

  const resetModal = () => {
    setFile(null);
    setProducts([]);
    setErrors([]);
    setStep('upload');
    setProgress(0);
    setIsProcessing(false);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Produtos via Excel
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="mb-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template Excel
              </Button>
              <p className="text-sm text-gray-600">
                Baixe o template, preencha com seus produtos e faça o upload abaixo.
              </p>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">
                Arraste o arquivo Excel aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formatos aceitos: .xlsx, .xls
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview da Importação</h3>
              <Button onClick={() => setStep('upload')} variant="outline" size="sm">
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errors.length} erro(s) encontrado(s). Corrija os erros antes de continuar:
                  <ul className="mt-2 list-disc list-inside">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">
                        Linha {error.row}: {error.message}
                      </li>
                    ))}
                    {errors.length > 5 && (
                      <li className="text-sm">E mais {errors.length - 5} erro(s)...</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {products.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {products.length} produto(s) válido(s) serão importados.
                </AlertDescription>
              </Alert>
            )}

            {products.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Produtos a serem importados:</h4>
                <div className="max-h-60 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Categoria</th>
                        <th className="text-left p-2">Preço</th>
                        <th className="text-left p-2">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 10).map((product, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{product.nome}</td>
                          <td className="p-2">{product.categoria}</td>
                          <td className="p-2">R$ {product.precoDesconto.toFixed(2)}</td>
                          <td className="p-2">{product.quantidade}</td>
                        </tr>
                      ))}
                      {products.length > 10 && (
                        <tr className="border-t">
                          <td colSpan={4} className="p-2 text-center text-gray-500">
                            E mais {products.length - 10} produto(s)...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={importProducts}
                disabled={products.length === 0 || isUploading}
              >
                Importar {products.length} Produto(s)
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-medium">Importando Produtos...</h3>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              {Math.round(progress)}% concluído
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium">Importação Concluída!</h3>
            <p className="text-gray-600">
              Os produtos foram importados com sucesso.
            </p>
            <Button onClick={handleClose}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}