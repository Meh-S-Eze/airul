import { EditorOptions } from './types';

export function getEditorOptions(options: any): EditorOptions {
  const copilotEnabled = options.copilot || options.code;
  return {
    cursor: options.cursor === undefined ? undefined : Boolean(options.cursor),
    windsurf: options.windsurf === undefined ? undefined : Boolean(options.windsurf),
    copilot: copilotEnabled === undefined ? undefined : Boolean(copilotEnabled),
    cline: options.cline === undefined ? undefined : Boolean(options.cline)
  };
} 