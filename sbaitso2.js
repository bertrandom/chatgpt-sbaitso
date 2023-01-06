require('events').EventEmitter.prototype._maxListeners = 500;

const { exec } = require('node:child_process');
const readlineSync = require('readline-sync');
const wrap = require('wordwrap')(79);

const rp = require('request-promise-native');

const NetcatServer = require('netcat/server');
const NetcatClient = require('netcat/client');

var ncc = new NetcatClient().port(2048);

var say = async function(text, display = true) {

    return new Promise((resolve, reject) => {

        var ncs = new NetcatServer();

        ncs.addr('127.0.0.1').port(2049).listen().on('end', function(socket) {
            ncs.close(setTimeout(function() {
                ncs.removeAllListeners();
                resolve();
            }, 150));
        });
    
        if (display) {
            ansi.write(text);
        }
        ncc.connect().send(text).close();

    });

};

var playClip = function(clip) {

    return new Promise((resolve, reject) => {

        const target = `sounds/${clip}.wav`;
        exec(`afplay ${target}`, resolve);    
    
    });

}

var playClipBackground = function(clip) {

    const target = `sounds/${clip}.wav`;
    exec(`afplay ${target}`);    

}

var sayLetter = function(ch) {
    const target = `sounds/letters/${ch}.wav`;
    exec(`afplay ${target}`);    
}

var ansi = require('ansi2')(process.stdout)

var displayBanner = function() {
    ansi.reset().blueBg().white().bold().clear().goto()
    .write('╔══════════════════════════════════════════════════════════════════════════════╗\n')
    .write('║ Sound Blaster              ').yellow().write('D R    S B A I T S O').white().write('                 version 2.20 ║\n')
    .write('╟──────────────────────────────────────────────────────────────────────────────╢\n')
    .write('║                 ').green().write('(c) Copyright Creative Labs, Inc. 1992,').white().write('  all rights reserved ║\n')
    .write('╚══════════════════════════════════════════════════════════════════════════════╝\n');
}

var keypress = require('keypress');

var greetUser = async function(name) {
    await say(` HELLO ${name},  MY NAME IS DOCTOR SBAITSO.\n`);
    ansi.write('\n');
    await say(' I AM HERE TO HELP YOU.\n');
    await say(' SAY WHATEVER IS IN YOUR MIND FREELY,\n');
    await say(' OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.\n');
    await say(' MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,\n');
    ansi.write('\n');
    await say(' SO, TELL ME ABOUT YOUR PROBLEMS.');
    ansi.write('\n\n');
}

var prompt = async function(context = null) {
    ansi.reset().blueBg().yellow().bold();
    var answer = readlineSync.question('>');
    ansi.reset().blueBg().white().bold();
    if (answer.toLowerCase() == 'quit') {

        await displayCommands(context);
        return;

    } else if (answer.toLowerCase() == 'goodbye' || answer.toLowerCase() == 'good bye') {

        await say('GOOD BYE, SO LONG!\n');
        await displayCommands(context);
        return;

    }

    let body = null;

    if (context) {
        body = {
            prompt: answer,
            context,
        };
    } else {
        body = {
            prompt: answer,
        };
    }

    const res = await rp({
        uri: 'http://localhost:2050',
        method: 'POST',
        json: true,
        body
    });

    const words = res.response;

    const wrappedWords = wrap(words);

    const lines = wrappedWords.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line == '') {
            ansi.write(line + '\n');
        } else {
            await say(line.toUpperCase() + '\n');
        }
    }

    ansi.write('\n\n');
    await prompt({
        conversationId: res.conversationId,
        parentMessageId: res.messageId        
    });
}

var displayCommands = async function(context = null) {

    ansi.write('<C>ontinue  <N>ew patient  <Q>uit  .....');
    process.stdin.removeAllListeners('keypress');

    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on('keypress', async function (ch, key) {

        if (key && key.ctrl && key.name == 'c') {
            process.stdin.pause();
            process.exit();
        } else if (ch == 'C' || ch == 'c') {
            ansi.write('\n\n');
            process.stdin.pause();
            process.stdin.setRawMode(false);
            process.stdin.removeAllListeners('keypress');
            await prompt(context);
        } else if (ch == 'N' || ch == 'n') {
            process.stdin.pause();
            process.stdin.setRawMode(false);
            process.stdin.removeAllListeners('keypress');
            displayBanner();
            await doIntro();
        } else if (ch == 'Q' || ch == 'q') {
            process.stdin.pause();
            process.exit();
        }

    });

}

var doIntro = async function() {

    await playClip('drsbaitso');

    ansi.write('\n')
        .write('Please enter your name ...');

    await playClipBackground('pleaseenter');

    // make `process.stdin` begin emitting "keypress" events
    keypress(process.stdin);
    
    var buffer = '';
    
    // listen for the "keypress" event
    process.stdin.on('keypress', async function (ch, key) {
        if (key && key.name == 'return') {
            process.stdout.write("\n");
            process.stdin.pause();
            process.stdin.setRawMode(false);
            await greetUser(buffer.toUpperCase());
            await prompt();
        } else if (key && key.name == 'backspace') {
            if (buffer != '') {
                buffer = buffer.slice(0, -1);
                ansi.back().write(' ').back();
            }
        } else if (key && key.ctrl && key.name == 'c') {
            process.stdin.pause();
            process.exit();
        } else {
    
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch == ' ') {
                buffer += ch;
                process.stdout.write(ch);
                if (ch !== ' ') {
                    sayLetter(ch.toUpperCase());
                }
            } else {
                await playClipBackground('alphabetsonly');
            }
    
        }
    });
    
    process.stdin.setRawMode(true);
    process.stdin.resume();

}

var main = async function() {

    displayBanner();
    await doIntro();
    // await prompt();

};

main();