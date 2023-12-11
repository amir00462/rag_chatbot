import bot from './assets/bot.svg'
import user from './assets/user.svg'
import copy from './assets/ic_copy.png'
import copy_success from './assets/ic_copy_success.png'

// variables
const BASE_URL = "http://156.253.5.103:5000/chat"
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const submitButton = form.querySelector('#submitButton');
const textarea = form.querySelector('textarea');
const bannerContainer = document.getElementById('bannerContainer');
let isSubmitButtonActive = false;
let loadInterval;
const maxRows = 8;
let showBanner = true;

bannerContainer.style.display = showBanner ? 'block' : 'none';

// for submit button
updateButtonState();

function updateButtonState() {
    if (isSubmitButtonActive) {
        // Set background color with transparency (e.g., 0.8)
        submitButton.style.backgroundColor = 'rgba(254, 254, 254, 1)';
    } else {
        // Set background color with transparency (e.g., 0.6)
        submitButton.style.backgroundColor = 'rgba(204, 204, 204, 0.6)';
    }
}

// main functions
function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)

}

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId, hideIcon = false) {
    return (
        `
            <div class="wrapper ${isAi && 'ai'}">

                <div class="chat">
                    <div class="profile">
                        <img 
                          src=${isAi ? bot : user} 
                          alt="${isAi ? 'bot' : 'user'}" 
                        />
                    </div>
                    <div class="message" id=${uniqueId}>${value}</div>
                </div>

                </div>
        `
        /* ${isAi ? `<div class="copy_div"><img src=${copy} alt="copy text" /></div>` : ` `} */

    )
}

// function chatStripe(isAi, value, uniqueId, hideIcon = false) {
//     const copyIcon = isAi ? `<span class="copy-icon" onclick="copyToClipboard('${uniqueId}')">&#128203;</span>` : '';

//     return (
//         `
//             <div class="wrapper ${isAi && 'ai'}">
//                 <div class="chat">
//                     <div class="profile">
//                         <img 
//                           src=${isAi ? bot : user} 
//                           alt="${isAi ? 'bot' : 'user'}" 
//                         />
//                     </div>
//                     <div class="message" id=${uniqueId}>
//                         ${value}
//                         ${!hideIcon ? copyIcon : ''}
//                     </div>
//                 </div>
//             </div>
//         `
//     );
// }

function copyToClipboard(elementId) {
    const textToCopy = document.getElementById(elementId).innerText;

    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);

    textArea.select();
    document.execCommand('copy');

    document.body.removeChild(textArea);
}

const sendMessageToServer = async (prompt) => {

    try {

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        const urlWithParams = new URL(`${BASE_URL}`);
        urlWithParams.searchParams.append('query', prompt);

        const response = await fetch(urlWithParams, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            // mode: 'no-cors',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(response.statusText);
            return "مشکل در اتصال به سرور, لطفا اینترنت خود را چک کنید."
        }

        const data = await response.json();
        return data.result.trim();

    } catch (error) {
        console.error(error);
        return "مشکل در اتصال به سرور, لطفا اینترنت خود را چک کنید."
    }
};


// const sendMessageToServer = async (prompt) => {
//     try {
//         const response = await fetch('http://localhost:5000/chat', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 prompt: prompt
//             })
//         });

//         if (!response.ok) {
//             console.error(response.statusText);
//             return "مشکل در اتصال به سرور, لطفا اینترنت خود را چک کنید."
//         }

//         const data = await response.json();
//         return data.bot.trim();
//     } catch (error) {
//         console.error(error);
//         return "مشکل در اتصال به سرور, لطفا اینترنت خود را چک کنید."
//     }
// };


function handleClearScreen() {
    chatContainer.innerHTML = '';
    textarea.rows = 1;
    textarea.value = "";

    if (showBanner == false) {
        showBanner = true;
        bannerContainer.style.display = showBanner ? 'block' : 'none';
    }
}

const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitButtonActive) {

        if (showBanner == true) {
            showBanner = false;
            bannerContainer.style.display = showBanner ? 'block' : 'none';
        }

        const data = new FormData(form)

        // user's chatstripe
        chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

        // to clear the textarea input 
        form.reset()
        form.querySelector('textarea').rows = 1;

        // handle submit button
        isSubmitButtonActive = false;
        updateButtonState();

        // bot's chatstripe
        const uniqueId = generateUniqueId()
        chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

        // to focus scroll to the bottom 
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // specific message div 
        const messageDiv = document.getElementById(uniqueId)

        // messageDiv.innerHTML = "..."
        loader(messageDiv)

        try {

            // Send messages to the server
            const parsedData = await sendMessageToServer(data.get('prompt'));

            clearInterval(loadInterval);
            messageDiv.innerHTML = " ";

            // Show the response of the request
            typeText(messageDiv, parsedData);

        } catch (error) {
            messageDiv.innerHTML = "مشکل در اتصال به سرور";
            alert(error.message);
        }

    }
}

function isCursorAtBeginningOfLine(textarea) {
    const cursorPos = textarea.selectionStart;
    const lines = textarea.value.split('\n');
    let currentLineStart = 0;

    for (let i = 0; i < lines.length; i++) {
        if (cursorPos <= currentLineStart + lines[i].length) {
            return cursorPos === currentLineStart;
        }
        currentLineStart += lines[i].length + 1; // +1 for the newline character
    }

    return false;
}


function handleBackspace(e) {
    // const textarea = e.target;
    const currentRows = textarea.rows;

    if (textarea.value === '') {
        textarea.value = '';
        textarea.rows = 1;
    } else if (currentRows > 1 && textarea.scrollHeight > 1) {
        textarea.rows--;
    }
}

// event listeners 
textarea.addEventListener('keydown', (e) => {

    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();

        const textarea = e.target;
        const currentRows = textarea.rows;

        if (currentRows < maxRows) {
            textarea.rows = currentRows + 1;
        }

        textarea.value = textarea.value.substring(0, textarea.selectionStart) + '\n' + textarea.value.substring(textarea.selectionEnd);
        textarea.scrollTop = textarea.scrollHeight; // Scroll to the bottom of the textarea

    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    } else if (e.key === 'Backspace' && isCursorAtBeginningOfLine(textarea)) {
        handleBackspace(e);
    }

});
textarea.addEventListener('input', (e) => {
    isSubmitButtonActive = e.target.value.trim() !== '';
    updateButtonState();
});
textarea.addEventListener('scroll', () => {
    const isScrollBarVisible = textarea.scrollHeight > textarea.clientHeight;

    if (isScrollBarVisible) {
        console.log('Scroll bar is visible');
    } else {
        console.log('Scroll bar is hidden');
    }
});
form.addEventListener('submit', handleSubmit);
document.getElementById('clearButton').addEventListener('click', handleClearScreen);

textarea.addEventListener('paste', (event) => {
    const pastedText = event.clipboardData.getData('text/plain');
    const textLength = pastedText.length;

    const maxTextLengthPerRow = 80; // Adjust this value to your preference
    const numRows = Math.ceil(textLength / maxTextLengthPerRow);

    textarea.rows = numRows;
});