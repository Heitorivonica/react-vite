import { useEffect, useRef } from 'react'
import { namePasted } from './files'

// Se houver mais de uma área de anexos aberta (ex.: ficha do cliente + tarefa por cima),
// só a mais recente recebe o que for colado com Ctrl+V.
const pasteStack = []

// Chama onFiles(arquivos) quando a pessoa cola arquivos ou imagens (Ctrl+V).
// Texto comum não é capturado: continua colando normalmente nos campos.
export default function useFilePaste(enabled, onFiles) {
  const handlerRef = useRef(onFiles)

  // Sempre guarda a versão mais nova da função
  useEffect(() => {
    handlerRef.current = onFiles
  })

  useEffect(() => {
    if (!enabled) return
    const token = {}
    pasteStack.push(token)
    const onPaste = (e) => {
      if (pasteStack[pasteStack.length - 1] !== token) return
      const pasted = [...(e.clipboardData?.files ?? [])]
      if (pasted.length === 0) return
      e.preventDefault()
      handlerRef.current(pasted.map(namePasted))
    }
    document.addEventListener('paste', onPaste)
    return () => {
      document.removeEventListener('paste', onPaste)
      pasteStack.splice(pasteStack.indexOf(token), 1)
    }
  }, [enabled])
}
