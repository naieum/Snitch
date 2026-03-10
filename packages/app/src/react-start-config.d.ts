declare module "@tanstack/react-start/config" {
  export function defineConfig(config: {
    vite?: any;
    [key: string]: any;
  }): any;
}
