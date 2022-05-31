const express = require('express')
const { v4: uuidv4 } = require('uuid')
const app = express()
const costumers = []

app.use(express.json())

// Criando um middleware para verificar se existe alguma conta criada com o respectivo CPF

function verifyAccount (request, response, next) {
    const { cpf } = request.headers
    const costumer = costumers.find( (costumer) => costumer.cpf == cpf )

    // Função que limita as operações para contas já criadas.
    if (!costumer) {
        return response.status(400).json({ error: "Costumer don't exist!"})
    }

    request.costumer = costumer;

    return next()
}

function getBalance(statment){
    const balance = statment.reduce((acc, operation) => {
        if (operation.type === 'deposito') {
            return acc + operation.amount
        } else if(operation.type === 'saque'){
            return acc - operation.amount
        }
    },0)

    return balance
}

app.post('/conta', (request, response) => { 
    const { cpf, name } = request.body
    const costumersAlreadyExists = costumers.some( (costumer) => costumer.cpf === cpf )

    if (isNaN(cpf) == true){
        return response.status(400).json({ error: "Informe um CPF válido (somente números)"})
    }

    if (cpf.length != 11){
        return response.status(400).json({ error: "Informe um CPF válido (11 caracteres)"})
    }
    
    if (costumersAlreadyExists) {
        return response.status(400).json({ error: "Costumers already exists!" })
    }
    
    costumers.push({
        cpf,
        name,
        id: uuidv4(),
        statment: [],
    })
    
    return response.status(201).json({ message: "Conta criada!"}).send()

})

app.get('/extrato', verifyAccount, (request, response) => {
    const costumer = request.costumer

    return response.json(costumer.statment)
})

app.post('/deposito', verifyAccount, (request, response) => {
    const { description, amount } = request.body
    const { costumer } = request

    costumer.statment.push({ description, created_at: new Date(),
    amount, type: 'deposito', 
    })

    return response.status(201).json({ message: `Você fez um depósito de ${amount} com a seguinte descrição: ${description}`}).send()
})

app.post('/saque', verifyAccount, (request, response) => {
    const { amount } = request.body
    const { costumer } = request
    const balance = getBalance(costumer.statment)
    if(balance < amount){
        return response.status(400).json({ erro: 'Saldo insuficiente para fazer o saque.'})
    }
    costumer.statment.push({
        created_at: new Date(),
        amount,
        type: 'saque'
    })
    return response.status(201).json({ message: `Saque realizado.`}).send()

})

app.get('/extrato/data', verifyAccount, (request, response) => {
    const costumer = request.costumer
    const { date } = request.query
    const dateFormat = new Date(date + " 00:00")
    const statment = costumer.statment.filter((statments) => statments.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(costumer.statment)
})

app.put('/conta', verifyAccount, (request, response) => {  
    const { name } = request.body
    const { costumer } = request
    
    costumer.name = name
    
    return response.status(201).send()
})
app.get('/conta', verifyAccount, (request, response) => {
    const {costumer} = request

    return response.json(costumer)
})
app.delete('/conta', verifyAccount, (request, response) => {
    const { costumer } = request

    costumers.splice(costumer, 1)

    return response.status(200).json(costumers)
})
app.get('/balance', verifyAccount, (request, response) => {
    const { costumer } = request
    const balance = getBalance(costumer.statment)

    return response.json({ message: `Seu saldo é de R$${balance}.`})
})
  
app.listen(3333)