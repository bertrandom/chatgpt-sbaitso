require('dotenv-safe').config();

var main = async function() {

    const { ChatGPTAPIBrowser } = await import('chatgpt');

    const api = new ChatGPTAPIBrowser({
        email: process.env.OPENAI_EMAIL,
        password: process.env.OPENAI_PASSWORD,
        debug: false,
        minimize: true
    });

    await api.initSession();

    const express = require('express');
    const app = express();
    const port = 2050;

    app.use(express.json());

    app.post('/', async (req, res) => {

        if (req.body && req.body.prompt) {

            console.log('Prompt: ' + req.body.prompt);

            if (req.body.context) {
                console.log('Context', req.body.context);
                openAiResponse = await api.sendMessage(req.body.prompt, req.body.context);
            } else {
                openAiResponse = await api.sendMessage(req.body.prompt);
            }

            console.log('Response: ' + openAiResponse.response);
            console.log('Response Context: ', {
                conversationId: openAiResponse.conversationId,
                messageId: openAiResponse.messageId        
            });

            res.send(openAiResponse);

        } else {
            res.sendStatus(400);
        }

    });

    app.listen(port, () => {
        console.log(`ChatGPT server listening on port ${port}`)
    });

};

main();