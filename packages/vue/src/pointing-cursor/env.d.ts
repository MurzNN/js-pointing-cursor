/// <reference types="vite/client" />

declare module '*.svg.txt?raw' {
  const content: string
  export default content
}
