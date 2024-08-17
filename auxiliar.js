const { v4: uuidv4 } = require("uuid")

function generateCPF() {
  function randomDigit() {
    return Math.floor(Math.random() * 10)
  }

  function calculateCheckDigit(cpfArray, weight) {
    let sum = cpfArray
      .map((digit, index) => digit * (weight - index))
      .reduce((acc, curr) => acc + curr, 0)

    let checkDigit = (sum * 10) % 11
    return checkDigit === 10 ? 0 : checkDigit
  }

  // Gera os primeiros nove dígitos do CPF
  let cpf = Array.from({ length: 9 }, randomDigit)

  // Calcula o primeiro dígito verificador
  cpf.push(calculateCheckDigit(cpf, 10))

  // Calcula o segundo dígito verificador
  cpf.push(calculateCheckDigit(cpf, 11))

  // Formata o CPF no padrão XXX.XXX.XXX-XX
  return cpf.join("")
}

function gerarData() {
  // Obtém a data de hoje
  const today = new Date()

  // Obtém o ano, mês e dia da data de hoje
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0") // Adiciona 1 ao mês, pois é baseado em zero
  const day = String(today.getDate()).padStart(2, "0")

  // Formata a data no formato YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`

  return formattedDate
}

function generateUniqueId() {
  return uuidv4()
}

module.exports = { generateCPF, gerarData, generateUniqueId }
