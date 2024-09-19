import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('autocsharp.generateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const line = document.lineAt(selection.start.line);
        const lineText = line.text.trim();

        let comment = '';
        if (lineText.startsWith('//')) {
            comment = lineText.substring(2).trim();
        } else if (lineText.startsWith('/*')) {
            const endLine = document.lineAt(selection.end.line);
            comment = document.getText(new vscode.Range(selection.start, endLine.range.end));
            comment = comment.replace(/^\/\*|\*\/$/g, '').trim();
        } else {
            vscode.window.showErrorMessage('No comment found at the current line.');
            return;
        }

        try {
            const generatedCode = await generateCodeFromAI(comment, document.languageId);
            await insertGeneratedCode(editor, selection.start.line + 1, generatedCode);
            vscode.window.showInformationMessage('Code generated successfully!');
        } catch (error) {
            vscode.window.showErrorMessage('Error generating code: ' + error);
        }
    });

    context.subscriptions.push(disposable);
}

async function generateCodeFromAI(comment: string, languageId: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in your environment variables.');
    }

    const prompt = `Generate ${languageId} code based on this comment: ${comment}`;
    const messages = [
        { role: "system", content: `You are a code generation assistant. Your responses should contain only valid ${languageId} code, without any explanations or markdown formatting.` },
        { role: "user", content: `Generate ${languageId} code based on this comment: ${comment}` }
    ];
    // const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    //     prompt: prompt,
    //     max_tokens: 150,
    //     n: 1,
    //     stop: null,
    //     temperature: 0.5,
    // }, {
    //     headers: {
    //         'Authorization': `Bearer ${apiKey}`,
    //         'Content-Type': 'application/json'
    //     }
    // });
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        "model": "gpt-4o",
        "messages": messages
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    //return response.data.choices[0].text.trim();
    return response.data.choices[0].message.content;
}

async function insertGeneratedCode(editor: vscode.TextEditor, line: number, code: string) {
    await editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(line, 0), code + '\n');
    });
}

export function deactivate() {}