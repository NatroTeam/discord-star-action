import core from '@actions/core';
import github from '@actions/github';
import fetch from 'node-fetch';
import * as fs from 'fs';

const webhook_url = core.getInput('webhook_url');
const badWords = ['fuck', 'faggot', 'nigga', 'nigger', 'faggots'];

let star_users = (fs.existsSync('star_users.json') && fs.statSync('star_users.json').isFile()) ? JSON.parse(fs.readFileSync('star_users.json')) : [];
star_users.push = function () {
    if (this.length >= 10) {
        this.shift();
    }
    return Array.prototype.push.apply(this, arguments);
}

let sender = github.context.payload.sender;

if (badWords.some(word => sender.login.toLowerCase().includes(word))) {
    core.info(`User @${sender.login} contains bad words.`);
} else if (star_users.includes(sender.login)) {
    core.info(`User @${sender.login} has already starred the repo recently!`);
} else {
    let message = {
        embeds: [{
            color: 16755763,
            description: `🌠 **[@${sender.login}](${sender.html_url}) has just starred [Natro Macro](https://github.com/NatroTeam/NatroMacro)! (#${github.context.payload.repository.stargazers_count})**`
        }]
    }
    
    fetch(`${webhook_url}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
    })
        .then(response => response.text())
        .then(text => core.info(text))
        .catch(err => { core.setFailed(err.message) });

    star_users.push(sender.login);
    fs.writeFileSync('star_users.json', JSON.stringify(star_users));
}
