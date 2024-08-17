const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")
const fs = require("fs")
const bodyParser = require("body-parser")
const express = require("express")
const { createClient } = require("@supabase/supabase-js")
const cron = require("node-cron")
const { exec } = require("child_process")
const platform = process.platform

require("dotenv").config()

const { generateCPF } = require("./auxiliar")
const { gerarData } = require("./auxiliar")
const { generateUniqueId } = require("./auxiliar")

const { VIDEOS } = require("./variaveis")
const { PHOTOS } = require("./variaveis")
const { STATES } = require("./variaveis")
const { MESSAGES } = require("./variaveis")
const { BUTTONS } = require("./variaveis")

const path = require("path")
const app = express()

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

const token = process.env.TOKEN

//Teste
const urlapi = process.env.URLTESTE
const ci = process.env.CITESTE
const cs = process.env.CSTESTE

// //Producao
// const urlapi = process.env.URLAPI
// const ci = process.env.CIAPI
// const cs = process.env.CSAPI

// Configurar Supabase
const supabaseUrl = process.env.SUPABASEURL
const supabaseKey = process.env.SUPABASEKEY

const supabase = createClient(supabaseUrl, supabaseKey)

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const bot = new TelegramBot(token, { polling: true })

const downloadFile = async (url, path) => {
  if (!url) {
    console.error(`URL para o arquivo ${path} está ausente`)
    throw new Error("URL ausente")
  }
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  })
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(path)
    response.data.pipe(writer)
    writer.on("finish", resolve)
    writer.on("error", (error) => {
      console.error(`Erro ao salvar o arquivo ${path}:`, error)
      reject(error)
    })
  })
}

async function gerarPay(chatId, userName) {
  try {
    const body = {
      userID: chatId,
      requestNumber: generateUniqueId(),
      dueDate: gerarData(),
      amount: 1.0,
      callbackUrl: "http://localhost:3000/webhook-pay",
      client: {
        name: userName,
        document: generateCPF(),
      },
    }

    const response = await axios({
      method: "POST",
      url: "http://localhost:3000/getpix", // URL completa do seu endpoint
      data: body,
    })

    const chavePix = response.data
    const urlPix = `http://localhost:3000/codigoPix?pix=${chavePix}/`

    if (platform === "win32") {
      exec(`start ${urlPix}`)
    } else if (platform === "darwin") {
      exec(`open ${urlPix}`)
    } else if (platform === "linux") {
      exec(`xdg-open ${urlPix}`)
    }

    bot.sendMessage(
      chatId,
      "Na área pix em 'PIX COPIA E COLA', cole esse código de pagamento! \n\nDepois de efetuar o pagamento, iremos liberar o seu acesso ao grupo. Por favor, não exclua esse chat até receber o acesso."
    )
  } catch (error) {
    console.error("Erro ao processar /start:", error)
    await bot.sendMessage(chatId, MESSAGES.ERROR)
  }
}

// async function gerarPay(chatId, userName) {
//   try {
//     const body = {
//       userID: chatId,
//       requestNumber: generateUniqueId(),
//       dueDate: gerarData(),
//       amount: 1.0,
//       callbackUrl: "http://localhost:3000/webhook-pay",
//       client: {
//         name: userName,
//         document: generateCPF(),
//       },
//     }
//     axios({
//       method: "POST",
//       url: "http://localhost:3000/getpix", // URL completa do seu endpoint
//       data: body,
//     })
//       .then((response) => {
//         // console.log("Resposta:", response.data)
//         const chavePix = response.data

//         const urlPix = `http://localhost:3000/codigoPix?pix=${chavePix}/`

//         open(urlPix)
//           .then(() => {
//             console.log(`Página aberta: ${urlPix}`)
//           })
//           .catch((err) => {
//             console.error("Erro ao abrir a página:", err)
//           })

//         // bot.sendMessage(chatId, urlPix)
//         bot.sendMessage(
//           chatId,
//           "Na área pix em 'PIX COPIA E COLA', cole esse código de pagamento! \n\nDepois de efetuar o pagamento, iremos liberamos o seu acesso ao grupo. Por favor, não exclua esse chat até receber o acesso."
//         )
//       })

//       .catch((error) => {
//         console.error(
//           "Erro:",
//           error.response ? error.response.data : error.message
//         )
//       })

//     // console.log("dentro", response)

//     // await bot.sendMessage(chatId, "la")
//   } catch (error) {
//     console.error("Erro ao processar /start:", error)
//     await bot.sendMessage(chatId, MESSAGES.ERROR)
//   }
// }

// Função para enviar uma mensagem com o botão
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id

//   // Define o texto a ser copiado
//   const textToCopy = "Este é o texto a ser copiado!"

//   // Cria o botão inline
//   const opts = {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: "Copiar Texto",
//             callback_data: "copy_text",
//           },
//         ],
//       ],
//     },
//   }

//   // Envia a mensagem com o botão
//   bot.sendMessage(chatId, textToCopy, opts)
// })

// // Lida com o callback do botão
// bot.on("callback_query", (callbackQuery) => {
//   const message = callbackQuery.message
//   const chatId = message.chat.id

//   if (callbackQuery.data === "copy_text") {
//     // Envia uma mensagem com o texto a ser copiado
//     bot.sendMessage(chatId, "Texto copiado para a área de transferência!")
//   }
// })

// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id
//   const userName = msg.from.first_name

//   gerarPay(chatId, userName)
// })

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  try {
    await bot.sendMessage(chatId, MESSAGES.TEXT_01)

    await downloadFile(VIDEOS.VIDEO_01.url, VIDEOS.VIDEO_01.path)
    await bot.sendVideo(chatId, VIDEOS.VIDEO_01.path, {
      supports_streaming: true,
    })

    await delay(3000)

    await bot.sendMessage(chatId, MESSAGES.TEXT_02, {
      reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_01]] },
    })
  } catch (error) {
    console.error("Erro ao processar /start:", error)
    await bot.sendMessage(chatId, MESSAGES.ERROR)
  }
})

bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message
  const chatId = message.chat.id
  const data = callbackQuery.data
  const userName = message.from.first_name

  try {
    switch (data) {
      case STATES.BLOCO_01:
        await downloadFile(PHOTOS.PHOTO_01.url, PHOTOS.PHOTO_01.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_01.path)

        await delay(1500)

        await downloadFile(VIDEOS.VIDEO_02.url, VIDEOS.VIDEO_02.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_02.path, {
          supports_streaming: true,
        })

        await delay(3000)

        await bot.sendMessage(chatId, MESSAGES.TEXT_03)

        await downloadFile(PHOTOS.PHOTO_02.url, PHOTOS.PHOTO_02.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_02.path)

        await delay(1500)

        await downloadFile(VIDEOS.VIDEO_03.url, VIDEOS.VIDEO_03.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_03.path, {
          supports_streaming: true,
        })

        await delay(3000)

        await bot.sendMessage(chatId, MESSAGES.TEXT_04)

        await downloadFile(PHOTOS.PHOTO_03.url, PHOTOS.PHOTO_03.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_03.path)

        await delay(1500)

        await downloadFile(VIDEOS.VIDEO_04.url, VIDEOS.VIDEO_04.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_04.path, {
          supports_streaming: true,
        })

        await delay(3000)

        await bot.sendMessage(chatId, MESSAGES.TEXT_05)

        await downloadFile(PHOTOS.PHOTO_04.url, PHOTOS.PHOTO_04.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_04.path)

        await delay(1500)

        await downloadFile(VIDEOS.VIDEO_05.url, VIDEOS.VIDEO_05.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_05.path, {
          supports_streaming: true,
        })

        await bot.sendMessage(chatId, MESSAGES.TEXT_06)

        await bot.sendMessage(chatId, MESSAGES.TEXT_07, {
          reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_02]] },
        })
        break

      case STATES.BLOCO_02:
        await downloadFile(PHOTOS.PHOTO_05.url, PHOTOS.PHOTO_05.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_05.path)

        await delay(1500)

        await downloadFile(VIDEOS.VIDEO_06.url, VIDEOS.VIDEO_06.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_06.path, {
          supports_streaming: true,
        })

        await delay(3000)

        await bot.sendMessage(chatId, MESSAGES.TEXT_08)

        await downloadFile(PHOTOS.PHOTO_06.url, PHOTOS.PHOTO_06.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_06.path)

        await delay(1500)

        await downloadFile(PHOTOS.PHOTO_07.url, PHOTOS.PHOTO_07.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_07.path)

        await delay(1500)

        await bot.sendMessage(chatId, MESSAGES.TEXT_09, {
          reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_03]] },
        })
        break

      case STATES.BLOCO_03:
        await downloadFile(VIDEOS.VIDEO_07.url, VIDEOS.VIDEO_07.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_07.path, {
          supports_streaming: true,
        })

        await delay(3000)

        await bot.sendMessage(chatId, MESSAGES.TEXT_10)

        await downloadFile(PHOTOS.PHOTO_08.url, PHOTOS.PHOTO_08.path)
        await bot.sendPhoto(chatId, PHOTOS.PHOTO_08.path)

        await delay(1500)

        await bot.sendMessage(chatId, MESSAGES.TEXT_11)
        await bot.sendMessage(chatId, MESSAGES.TEXT_12)
        await bot.sendMessage(chatId, MESSAGES.TEXT_13, {
          reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_04]] },
        })
        break

      case STATES.BLOCO_04:
        await bot.sendMessage(chatId, MESSAGES.TEXT_14, {
          reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_07]] },
        })
        break

      //   case STATES.BLOCO_06:
      //    await bot.sendMessage(chatId, MESSAGES.TEXT_16, {
      //       reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_07]] },
      //     })
      //     break

      case STATES.BLOCO_07:
        await bot.sendMessage(chatId, MESSAGES.TEXT_17)
        await gerarPay(chatId, userName)

        break

      case STATES.REMARK:
        await bot.sendMessage(chatId, MESSAGES.TEXT_19)

        await downloadFile(VIDEOS.VIDEO_08.url, VIDEOS.VIDEO_08.path)
        await bot.sendVideo(chatId, VIDEOS.VIDEO_08.path, {
          supports_streaming: true,
        })

        await delay(3000)

        await bot.sendMessage(chatId, MESSAGES.TEXT_20, {
          reply_markup: { inline_keyboard: [[BUTTONS.BLOCO_07]] },
        })
        break

      default:
        await bot.sendMessage(chatId, MESSAGES.ERROR)
        break
    }

    await bot.answerCallbackQuery(callbackQuery.id)
  } catch (error) {
    console.error("Erro ao processar callback_query:", error)
    await bot.answerCallbackQuery(callbackQuery.id, { text: MESSAGES.ERROR })
  }
})

// Rota para verificar se o servidor está funcionando
app.get("/", (req, res) => {
  res.send("Bot está funcionando!")
})

// Middleware para lidar com updates do Telegram
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body)
  res.sendStatus(200)
})

// app.post("/getpix", async (req, res) => {
//   const { requestNumber, dueDate, amount, callbackUrl, client } = await req.body
//   const url = "https://sandbox.ws.suitpay.app/api/v1/gateway/request-qrcode"
//   const headers = {
//     ci: "testesandbox_1687443996536",
//     cs: "5b7d6ed3407bc8c7efd45ac9d4c277004145afb96752e1252c2082d3211fe901177e09493c0d4f57b650d2b2fc1b062d",
//   }
//   // const body = {
//   //   requestNumber,
//   //   dueDate,
//   //   amount,
//   //   callbackUrl,
//   //   client,
//   // }
//   const body = {
//     requestNumber: 112121,
//     dueDate: "2022-10-30",
//     amount: 230.0,
//     callbackUrl: "http://localhost:3000/webhook/",
//     client: {
//       name: "userName",
//       document: "70143297821",
//     },
//   }

//   try {
//     const response = await axios({
//       url,
//       method: "POST",
//       headers,
//       body,
//     })

//     console.log(response)
//   } catch (error) {
//     console.log("error")
//   }

//   // bot.processUpdate(req.body)
//   // res.sendStatus(200)
// })

app.post("/getpix", async (req, res) => {
  const { userID, requestNumber, dueDate, amount, callbackUrl, client } =
    req.body
  const url = `${urlapi}/api/v1/gateway/request-qrcode`
  const headers = {
    ci: ci,
    cs: cs,
  }

  const body = {
    requestNumber,
    dueDate,
    amount,
    callbackUrl,
    client,
  }

  try {
    const response = await axios({
      url,
      method: "POST",
      headers,
      data: body,
    })

    const { error } = await supabase
      .from("Users")
      .insert([{ userID: userID, requestNumber: requestNumber }])

    if (error) {
      console.error("Erro ao salvar os dados no Supabase:", error)
      return res.status(500).send("Erro ao salvar os dados no Supabase")
    }

    console.log("Dados salvos com sucesso no Supabase!")

    // Combinar as respostas em uma única resposta JSON
    // res.status(200).json({
    //   message: "Dados salvos com sucesso!",
    //   paymentCode: response.data.paymentCode,
    // })

    res.status(200).json(response.data.paymentCode)
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    )
    res
      .status(error.response ? error.response.status : 500)
      .send({ error: error.message })
  }
})

app.post("/webhook-pay", async (req, res) => {
  const { statusTransaction, requestNumber } = req.body

  const { data, error } = await supabase
    .from("Users")
    .select("userID")
    .eq("requestNumber", requestNumber)

  if (error) {
    console.error("Error fetching userID:", error)
    res.status(400).send("Error ao consultar bd.")
  } else if (data.length > 0) {
    const userID = data[0].userID
    // console.log("userID:", userID)

    if (statusTransaction == "PAID_OUT") {
      // console.log("sim")
      bot.sendMessage(userID, "Seu Pagamento foi realizado com sucesso!")

      await supabase
        .from("Users")
        .update({ statusPay: "PAID_OUT" })
        .match({ userID: userID, requestNumber: requestNumber })

      res.status(200).send("Encontrado com sucesso!")
    }
  } else {
    res.status(404).send("No user found with the given requestNumber.")
    console.log("No user found with the given requestNumber.")
  }
})

// function triggerEventForUser(userID) {
//   // Código para acionar o evento
//   console.log("Event triggered for userID:", userID)
//   // Adicione aqui a lógica do evento
//   bot.sendMessage(
//     userID,
//     "Esta é uma mensagem automatizada enviada a cada 1 minuto."
//   )
// }

// cron.schedule("* * * * *", async () => {
//   console.log("dd")

//   const { data, error } = await supabase
//     .from("Users")
//     .select("userID")
//     .is("status", NULL) // Corrigido para 'null'

//   console.log(data)

//   if (error) {
//     console.error("Error fetching userIDs:", error)
//   } else {
//     if (data.length === 0) {
//       console.log("No user found with status NULL.")
//     } else {
//       // Iterar sobre todos os userIDs e acionar eventos
//       data.forEach((user) => {
//         const userID = user.userID
//         console.log("Triggering event for userID:", userID)
//         // Acione o evento aqui usando o `userID`
//         triggerEventForUser(userID)
//       })
//     }
//   }
// })

function triggerEventForUser(userID) {
  // Código para acionar o evento
  console.log("Event triggered for userID:", userID)
  // Adicione aqui a lógica do evento
  bot.sendMessage(
    userID,
    "Esta é uma mensagem automatizada enviada a cada 1 minuto."
  )
}

// cron.schedule("* * * * *", async () => {
//   console.log("Executando tarefa cron")

//   try {
//     const { data, error } = await supabase
//       .from("Users")
//       .select("userID")
//       .eq("statusPay", "null") // Certifique-se de que 'null' está em minúsculas

//     console.log(data)

//     if (error) {
//       console.error("Error fetching userIDs:", error)
//       return
//     }

//     if (data.length === 0) {
//       console.log("No user found with status NULL.")
//     } else {
//       // Iterar sobre todos os userIDs e acionar eventos
//       data.forEach((user) => {
//         const userID = user.userID
//         // console.log("Triggering event for userID:", userID)
//         // Acione o evento aqui usando o `userID`
//         triggerEventForUser(userID)
//       })
//     }
//   } catch (err) {
//     console.error("Erro ao buscar dados do Supabase:", err)
//   }
// })

// Iniciar o servidor na porta 3000
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

// async function AA() {
//   const { createClient } = require("@supabase/supabase-js")
//   const supabaseUrl = "https://ynmazclgojdsoucwpppt.supabase.co"
//   const supabaseKey =
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubWF6Y2xnb2pkc291Y3dwcHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM3ODA2ODUsImV4cCI6MjAzOTM1NjY4NX0.SwpPMLTpL2Oig7bHOe1u7mjUtZPWiQhfcPlty_ikOXo"

//   const supabase = createClient(supabaseUrl, supabaseKey)

//   const { data, error } = await supabase
//     .from("Users")
//     .select("userID")
//     .eq("statusPay", "null") // Certifique-se de que 'null' está em minúsculas

//   // const ID = await data.userID
//   // console.log(ID)

//   console.log(data)
// }

// AA()

// const fs = require('fs');

// // O código base64 fornecido
// const paymentCodeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAPoAAAD6AQAAAACgl2eQAAACyElEQVR4Xu2YQXYjIQwF4SJw/1vMUeAiMFWiJ/b0Im8WsWbTpG13Q+U9WfpfkJT9/fhV7jO38QBnPMAZD3DGvwGjlLr3Kq2vVvoojfd5JtOAyTUXz6NUblqfc1QnM4F43Lyv1vroo+5Vr8lMYI5mkH2yFjn7D8CyUn1RIag9+p/I04BglIwF68sAYzIRUJ/zPu6qvq//MBBjmSjiGoSIe/o1nQUMK4ReyA+3l3AbH4kASD8NZM/VVU+lYMacCDiDXRrvNhC9S5Av0SYAVIfc+Op2Dj28fP4STAJASgapcVKlGp8+8pUJkJmjVNJEwYz8fGQBZmfEFWOFZu0jmQB3Q7sUzWJf71GxVMD10t3VWASac58rD3AS0yDV5kU7r5q3+5tpAB6hdZU44RAsRiqiNRGY9i6VQufoIV4amkwi4CruJVXlim5aqDfzfh7gYINI5FY3YVE1In37Fh8HYi/bkiPCNEZm3kT7ecAwbSDd3LDInoJYKGEmEB0MrdTAAK+elglEkHsoFVtJtbVy0xMB/vTRszsOO/RPdpco31eQCcBo15GimCkG+vUnGRiXaSmU3bSIkrs8gNZhfN02NjVPo05GmgiEajWLq6aHT+5fxcoAzI3NtBvoCPn8VawEgIywMqwVyrGFWjrDzAMIkvJMW3lxN+v+zvvmngCEZRALcbFC1qatXDvlASoD12AaEhZSAdZHiYB61a/2cM4a5uq0kkRg+A8qatUslmsG6GMicISCXqsRMm2x2E9e3yIB0KvMIhQ/zNgVYh4QJUIdwzRx3jy1Q7eJgIMUYdoVqLvKbff/ODAMiFNOU6mxSrKQ7OtbfB6YcVEvEGil4w2vRMDYECyCIdwdp76ifZOBqVFmtI8QymWhXIDuGYGZMoVbo1Z5AJfWBaJUpdrNunlLBKIypGVanqljon+8ipUAfDce4IwHOOMBzvgB4DeEgjNd6KCd6wAAAABJRU5ErkJggg==";

// // Decodifica o base64 para binário
// const imageBuffer = Buffer.from(paymentCodeBase64, 'base64');

// // Escreve o buffer binário para um arquivo de imagem
// fs.writeFile('output.png', imageBuffer, (err) => {
//     if (err) {
//         console.error('Erro ao salvar a imagem:', err);
//     } else {
//         console.log('Imagem salva como output.png');
//     }
// });

app.get("/page", (req, res) => {
  res.sendFile(path.join(__dirname, "./", "index.html"))
})

app.get("/codigoPix", (req, res) => {
  const url = req.query.pix || "Nenhuma URL fornecida"

  // Decodifica a URL para exibir corretamente
  const decodedUrl = decodeURIComponent(url)

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Botão de Copiar</title>
    </head>
    <body>
      <h1>Chave Pix: <span id="nome">${decodedUrl}</span>!</h1>
      <button onclick="copiarTexto()">Copiar</button>

      <script>
        function copiarTexto() {
          // Obtém o texto do elemento <h1> que inclui o nome
          const nome = document.getElementById('nome').innerText;
          const texto = \`\${nome}!\`;

          // Usa a API Clipboard moderna para copiar o texto
          navigator.clipboard.writeText(texto).then(() => {
            alert('Chave Pix Copiado!');
          }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
          });
        }
      </script>
    </body>
    </html>
  `)
})
