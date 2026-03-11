import { join } from 'node:path';
import { fileExists, readFile } from '../../utils/fs.js';
import type { DetectedStack } from '../types.js';

export async function detect(cwd: string): Promise<DetectedStack | null> {
  const hasPom = await fileExists(join(cwd, 'pom.xml'));
  const hasGradle = await fileExists(join(cwd, 'build.gradle')) || await fileExists(join(cwd, 'build.gradle.kts'));

  if (!hasPom && !hasGradle) return null;

  const pm = hasGradle ? 'gradle' as const : 'maven' as const;
  let projectName = 'java-project';

  if (hasPom) {
    const content = await readFile(join(cwd, 'pom.xml'));
    const nameMatch = content.match(/<artifactId>([^<]+)<\/artifactId>/);
    if (nameMatch) projectName = nameMatch[1];
  }

  return {
    stack: 'java',
    packageManager: pm,
    testFramework: 'junit',
    linter: 'checkstyle',
    formatter: 'spotless',
    buildCommand: pm === 'gradle' ? './gradlew build' : 'mvn package',
    testCommand: pm === 'gradle' ? './gradlew test' : 'mvn test',
    hasTypeScript: false,
    projectName,
  };
}
