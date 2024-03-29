const axios = require('axios');
exports.LiberalizeWeb = class {
    constructor(publicKey, environment="production") {
        switch (environment) {
            case "production":
                this.cardElementUrl = "https://cards-element.liberalize.io/#/"
                this.qrElementUrl = "https://qr-element.liberalize.io/#/"
                this.paymentApi = "https://payment.api.liberalize.io"
                break;
            case "staging":
                this.cardElementUrl = "https://cards-element.staging.liberalize.io/#/"
                this.qrElementUrl = "https://qr-element.staging.liberalize.io/#/"
                this.paymentApi = "https://payment.api.staging.liberalize.io"
                break;
            case "dev":
                this.cardElementUrl = "https://cards-element.dev.liberalize.io/#/"
                this.qrElementUrl = "https://qr-element.dev.liberalize.io/#/"
                this.paymentApi = "https://payment.api.staging.liberalize.io"
                break;
            case "local":
                this.cardElementUrl = "https://cards-element.dev.liberalize.io/#/"
                this.qrElementUrl = "https://qr-element.dev.liberalize.io/#/"
                this.paymentApi = "https://payment.api.staging.liberalize.io"
            default:
                break;
        }

        this.public_key = publicKey;
        this.mainFrame = window.location.href;
        this.sessionSecretIdentity = {}
        this.iframeId = {}
    }

    installCSS() {
        const link = window.document.createElement('link');
            link.setAttribute('href', require('./index.css'));
            link.setAttribute('type', 'text/css');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('media', 'screen,print');
        
        window.document.getElementsByTagName('head')[0].appendChild(link);
    }

    generateId() {
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

    elementsCheckCard() {
        // TODO : Do some checks
        let error_occured = false;
        const error_box_element =  window.document.getElementById('liberalize-card-errors')
        error_box_element.innerText = 'Invalid Card Details'
        return (!error_occured)
    }

    async cardElement(targetElementId) {
        // console.log('targetElementId -> ', targetElementId);
        let that = this;
        try {
            // CREATE DIV
            const card_element_wrapper = window.document.createElement('div');
            card_element_wrapper.setAttribute('class', 'card_element_wrapper')
            // CREATE IFRAME
            const card_element_iframe = window.document.createElement('iframe');
            // console.log('that.public_key -> ', that.public_key);
            card_element_iframe.setAttribute('src', that.cardElementUrl+"?pub="+ that.public_key)
            card_element_iframe.setAttribute('class', 'lib-iframe')
            // Set cards iframe ID to a uuid
            that.iframeId['cards'] = 'lib-' + that.generateId()
            card_element_iframe.setAttribute('id', that.iframeId['cards'])
            card_element_iframe.setAttribute('allow', 'payment') // use browser Payment request API
            // Set I-FRAME inside DIV
            card_element_wrapper.appendChild(card_element_iframe);
            // Set DIV inside target DIV element
            let targetElement = window.document.getElementById(targetElementId);
            targetElement.appendChild(card_element_wrapper);
            
            // Style the iframe and div height
            card_element_wrapper.style.height = targetElement.style.height;
            card_element_iframe.style.height = card_element_wrapper.style.height;
            card_element_iframe.style.backgroundColor = "#ffffff00";
            card_element_iframe.style.border = "none";
            card_element_iframe.style.overflow = "hidden";
            card_element_iframe.style.width = "100%"
            // installCSS()
            return new Promise(function(resolve, reject) {
                window.addEventListener('message', (message) => {
                    const msg = JSON.parse(message.data)
                    if (msg && msg.initialLoad) {
                        resolve({initialLoad: true})
                    }
                })
            })
        } catch (err) {
            return err
        }
    }

    async qrElement(targetElementId, qrData, source, size=256) {
        // console.log('targetElementId -> ', targetElementId);
        let that = this;
        try {
            // CREATE DIV
            const qr_element_wrapper = window.document.createElement('div');
            qr_element_wrapper.setAttribute('class', 'qr_element_wrapper')
            // CREATE IFRAME
            const qr_element_iframe = window.document.createElement('iframe');
            // console.log('that.public_key -> ', that.public_key);
            qrData = Buffer.from(qrData).toString('base64')
            qr_element_iframe.setAttribute('src', that.qrElementUrl+"?qrData="+ qrData+"&source="+source+"&size="+size)
            qr_element_iframe.setAttribute('class', 'lib-iframe')
            qr_element_iframe.setAttribute('scrolling', 'no')
            // Set cards iframe ID to a uuid
            that.iframeId['qr'] = 'lib-' + that.generateId()
            qr_element_iframe.setAttribute('id', that.iframeId['qr'])
            qr_element_iframe.setAttribute('allow', 'payment') // use browser Payment request API
            // Set I-FRAME inside DIV
            qr_element_wrapper.appendChild(qr_element_iframe);
            // Set DIV inside target DIV element
            let targetElement = window.document.getElementById(targetElementId);
            targetElement.innerHTML = '';
            targetElement.appendChild(qr_element_wrapper);
            
            // Style the iframe and div height
            qr_element_wrapper.style.height = `${size}px`;
            qr_element_iframe.style.height = `${size}px`;
            qr_element_wrapper.style.width = `${size}px`;
            qr_element_iframe.style.width = `${size}px`;
            qr_element_iframe.style.backgroundColor = "#ffffff00";
            qr_element_iframe.style.border = "none";
            qr_element_iframe.style.overflow = "hidden";
            // qr_element_iframe.style.width = "100%"
            // installCSS()
            return {
                load_status: "SUCCESS"
            }
        } catch (err) {
            return err
        }
    }

    async cardElementPay() {
        this.sessionSecretIdentity['cards'] = this.generateId();
        // console.log('this.iframeId[card] -> ', this.iframeId);
        let iFrame = window.document.getElementById(this.iframeId['cards'])
        let that = this;
        return new Promise(function (resolve, reject) {
            window.addEventListener('message', (message) => {
                // console.log('messaged received from iFrame : ', message);
                const msg = JSON.parse(message.data)
                // // messaged to be received by card paymentMethodId & sessionSecretIdentity
                if (msg && msg.sessionSecretIdentity === that.sessionSecretIdentity['cards']) {
                    const response = {
                        source: msg.paymentMethodId || "",
                        securityCode: msg.securityPin || "",
                        code: msg.code,
                        message: msg.message
                    }
                    // Resolve & response the paymentMethodID
                    resolve(response);
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
            // console.log('that.sessionSecretIdentity -> ', that.sessionSecretIdentity);
            iFrame.contentWindow.postMessage(`pay ${that.sessionSecretIdentity['cards']}`, '*')
        });
    }

    async qrSupported(libService="elements") {
        try {
            let buff = new Buffer(this.public_key + ":");
            let base64data = buff.toString('base64');
            var response = await axios.get(
                `${this.paymentApi}/supported`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Basic ${base64data}`,
                        "Access-Control-Allow-Origin": "*",
                        "x-lib-pos-type": libService
                    }
                }
            )
            // Beautify Response 
            const prettierResponse = {}
            if (response.data) {
                Object.keys(response.data).filter((eachScheme) => eachScheme !== 'card').map((eachScheme) => {
                    prettierResponse[eachScheme] = response.data[eachScheme]
                    prettierResponse[eachScheme] = prettierResponse[eachScheme].map((eachAccount, index) => {
                        // If there's no image returned, use fallback image
                        if (!eachAccount['image']) {
                            switch (eachScheme) {
                                case "alipayqr":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/fd3b5e2663add5b3b228b5f7c355e4e0bb44a128.png"
                                    break;
                                case "grabpay":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/adcbb770f61209613c3481424b24086c02776933.png"
                                    break;
                                case "liquidpay":
                                    eachAccount['image'] =  "https://payment-source-image.liberalize.io/bfcc2dd6ad8a250d629e561944b39e75c941b26d.png"
                                    break;
                                case "paynow":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/f739fcca806bd4faa8a3880cfff1a2d6335eec72.png"
                                    break;
                                case "shopeepay":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/66c544562d2e094339eb961998d00f2994892dff.png"
                                    break;
                                case "unionpayqr":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/3c2ce3134f32622a5204fb6324ccbddc0c87ffc6.png"
                                    break;
                                case "wechatpayqr":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/69a361a386fb9a5766c8bd67bfd91eb755885a87.png"
                                    break;
                                case "atomeredirect":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/fd3b5e2663add5b3b228b5f7c355e4e0b44atome.png"
                                    break;
                                case "atomeqr":
                                    eachAccount['image'] = "https://payment-source-image.liberalize.io/fd3b5e2663add5b3b228b5f7c355e4e0b44atome.png"
                                    break;
                                default:
                                    break;
                            }
                        }
                        return eachAccount
                    })
                })
            }
            return prettierResponse
        } catch (err) {
            return err
        }
    }

}