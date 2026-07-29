export function firstFencedBlock(markdown: string): string {
  const match = markdown.match(/```(?:text|json)?\s*\n([\s\S]*?)\n```/)
  if (!match?.[1])
    throw new Error('Prompt source has no fenced runtime block')
  return match[1].trim()
}

export function rulesOnly(prompt: string): string {
  return (prompt.split(/\n(?:ВЕРНИ|ВЫХОД|OUTPUT)(?=\s|:|$)/u, 1)[0] || prompt).trim()
}
