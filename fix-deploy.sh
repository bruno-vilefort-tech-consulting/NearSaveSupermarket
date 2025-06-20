#!/bin/bash
echo "Fixing deployment issue..."
cp -r dist/public ./public 2>/dev/null || echo "Public directory already exists"
echo "Deployment files ready"