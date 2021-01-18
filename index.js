const axios = require('axios');
import './index.css';

exports.LiberalizeWeb = class {
    constructor(publicKey, environment="prod") {
        switch (environment) {
            case "prod":
                this.#cardElementUrl = ""
                break;
            case "staging":
                this.#cardElementUrl = ""
                break;
            case "dev":
                this.#cardElementUrl = ""
                break;
            case "local":
                this.#cardElementUrl = ""
            default:
                break;
        }
        let buff = new Buffer(publicKey + ":");
        let base64data = buff.toString('base64');

        this.#public_key = base64data;
        this.#mainFrame = window.location.href;
        this.#sessionSecretIdentity = {}
        this.#iframeId = {}
    }

    #installCSS() {
        const link = window.document.createElement('link');
            link.setAttribute('href', require('./index.css'));
            link.setAttribute('type', 'text/css');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('media', 'screen,print');
        
        window.document.getElementsByTagName('head')[0].appendChild(link);
    }

    #generateId() {
        // Alphanumeric characters
        const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let autoId = '';

        for (let i = 0; i < 28; i++) {
            autoId += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        if (autoId.length !== 28) throw { Error: 'Invalid auto ID: ' + autoId}
        const currentTime = new Date()
        autoId = autoId + currentTime.getTime();
        return autoId;
    }

    #elementsCheckCard() {
        // TODO : Do some checks
        let error_occured = false;
        const error_box_element =  window.document.getElementById('liberalize-card-errors')
        error_box_element.innerText = 'Invalid Card Details'
        return (!error_occured)
    }

    async cardElement(targetElementId) {
        let that = this;
        try {
            // CREATE DIV
            const card_element_wrapper = window.document.createElement('div');
            card_element_wrapper.setAttribute('class', 'card_element_wrapper')
            // CREATE IFRAME
            const card_element_iframe = window.document.createElement('iframe');
            card_element_iframe.setAttribute('src', that.#cardElementUrl+"?pub="+ that.public_key)
            card_element_iframe.setAttribute('class', 'lib-iframe')
            // Set cards iframe ID to a uuid
            that.#iframeId['cards'] = 'lib-' + that.#generateId()
            card_element_iframe.setAttribute('id', that.#iframeId['cards'])
            card_element_iframe.setAttribute('allow', 'payment') // use browser Payment request API
            // Set I-FRAME inside DIV
            card_element_wrapper.appendChild(card_element_iframe);
            // Set DIV inside target DIV element
            let targetElement = window.document.getElementById(targetElementId);
            targetElement.appendChild(card_element_wrapper);
            
            // Style the iframe and div height
            card_element_wrapper.style.height = targetElement.style.height;
            card_element_iframe.style.height = card_element_wrapper.style.height;
        } catch (err) {
            return err
        }
    }

    async cardElementPay() {
        this.#sessionSecretIdentity['card'] = this.#generateId();
        let iFrame = window.document.getElementById(this.#iframeId['card'])
        let that = this;
        return new Promise(function (resolve, reject) {
            window.addEventListener('message', (message) => {
                console.log('messaged received from iFrame : ', message);
                const msg = JSON.parse(message.data)
                // // messaged to be received by card paymentMethodId & sessionSecretIdentity
                if (msg && msg.sessionSecretIdentity === that.#sessionSecretIdentity['card']) {
                    // Resolve & response the paymentMethodID
                    resolve(msg.paymentMethodId);
                //     var xhr = new XMLHttpRequest();
                //     xhr.open(opts.method, opts.url);
                //     xhr.onload = function () {
                //         if (this.status >= 200 && this.status < 300) {
                //             console.log('xhr.response : ', xhr.response);
                //             const resObj = JSON.parse(xhr.response)
                //             // IF NOT 3D-SECURE
                //             if (xhr.response && resObj && !resObj['3dsecure']) {
                //                 console.log('resolving non-3DS...');
                //                 // response the paymentMethodID
                //                 resolve(xhr.response);
                //             }
                //             // IF 3D-SECURE
                //             if (xhr.response && resObj && resObj['3dsecure']) {
                //                 console.log('resolving 3DS...');
                //                 // 1) open modal box with 3dsecure link
                //                 // add postMessage event listener that is able to resolve this promise

                //                 const modal = window.document.createElement('div');
                //                 modal.setAttribute('class', 'modal is-active')
                //                 const modal_background = window.document.createElement('div');
                //                 modal_background.setAttribute('class', 'modal-background')
                //                 modal.appendChild(modal_background);
                //                 const modal_content = window.document.createElement('div');
                //                 modal_content.setAttribute('class', 'modal-content')
                //                 modal_content.innerHTML = '<iframe src="'+ resObj['3dsecure'] + '"></iframe>'
                //                 modal_background.appendChild(modal_content);
                //                 window.document.getElementsByTagName('body')[0].appendChild(modal);

                //                 window.addEventListener('message', (message) => {
                //                     console.log('message  : ', message); 
                //                     if (!message || !message.data) return;
                //                     modal.setAttribute('class', 'modal')
                //                     resolve(message.data)
                //                 });

                //                 // window.setTimeout(() => {
                //                 //     console.log('3 secs later ...');
                //                 //     resolve(xhr.response)
                //                 // }, 3000);
                //             }
                //         } else {
                //             reject({
                //             status: that.status,
                //             statusText: xhr.statusText
                //             });
                //         }
                //     };
                    
                //     xhr.onerror = function () {
                //         reject({
                //             status: that.status,
                //             statusText: xhr.statusText
                //         });
                //     };
                //     // If required by 3DS
                //     if (opts.headers) {
                //         Object.keys(opts.headers).forEach(function (key) {
                //             xhr.setRequestHeader(key, opts.headers[key]);
                //         });
                //     }
                //     var params = opts.params;
                //     // We'll need to stringify if we've been given an object
                //     // If we have a string, this is skipped.
                //     if (params && typeof params === 'object') {
                //         params = Object.keys(params).map(function (key) {
                //             return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                //         }).join('&');
                //     }
                //     xhr.send(params);
                }
            });
            iFrame.contentWindow.postMessage(`${that.#public_key} ${that.#sessionSecretIdentity} tokenize-card`, '*')
        });
    }

}