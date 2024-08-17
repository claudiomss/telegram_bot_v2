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
// const urlapi = process.env.URLTESTE
// const ci = process.env.CITESTE
// const cs = process.env.CSTESTE

// //Producao
const urlapi = process.env.URLAPI
const ci = process.env.CIAPI
const cs = process.env.CSAPI

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
      callbackUrl: "http://77.37.69.161:3000/webhook-pay",
      client: {
        name: userName,
        document: generateCPF(),
      },
    }
    axios({
      method: "POST",
      url: "http://localhost:3000/getpix", // URL completa do seu endpoint
      data: body,
    })
      .then((response) => {
        // console.log("Resposta:", response.data)
        const chavePix = response.data
        bot.sendMessage(chatId, chavePix)
        bot.sendMessage(
          chatId,
          "Na área pix em 'PIX COPIA E COLA', cole esse código de pagamento! \n\n*Aviso: o código pix é todo o conteúdo acima (texto azul e o texto em branco), \n\nSelecione a convesa e copie \n\nDepois de efetuar o pagamento, iremos liberamos o seu acesso ao grupo. Por favor, não exclua esse chat até receber o acesso."
        )
      })

      .catch((error) => {
        console.error(
          "Erro:",
          error.response ? error.response.data : error.message
        )
      })

    // console.log("dentro", response)

    // await bot.sendMessage(chatId, "la")
  } catch (error) {
    console.error("Erro ao processar /start:", error)
    await bot.sendMessage(chatId, MESSAGES.ERROR)
  }
}

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

// Iniciar o servidor na porta 3000
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
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
