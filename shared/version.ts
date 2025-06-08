export const APP_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  stage: 'beta' as 'alpha' | 'beta' | 'rc' | 'stable',
  build: 1
};

export function getVersionString(): string {
  const { major, minor, patch, stage, build } = APP_VERSION;
  const baseVersion = `${major}.${minor}.${patch}`;
  
  if (stage === 'stable') {
    return baseVersion;
  }
  
  return `${baseVersion}-${stage}.${build}`;
}

export function getFullVersionInfo() {
  return {
    version: getVersionString(),
    buildDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    ...APP_VERSION
  };
}