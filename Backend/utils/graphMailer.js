// backend/utils/graphMailer.js
// ============================================================
// Microsoft Graph mailer — sends email via the Azure AD app
// registered by the project administrator.
//
// Requires these env vars (see backend/.env):
//   TENANT_ID
//   CLIENT_ID
//   CLIENT_SECRET
//   MAIL_FROM   (mailbox the emails are sent FROM, e.g. noreply@iik.co.za)
// ============================================================

const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');

let _client = null;
let _credential = null;
let _fromAddress = null;
let _initError = null;

function init() {
    if (_client) return;
    if (_initError) return; // don't retry after a hard failure

    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    _fromAddress = process.env.MAIL_FROM;

    if (!tenantId || !clientId || !clientSecret || !_fromAddress) {
        _initError = new Error(
            'Graph mailer: missing TENANT_ID, CLIENT_ID, CLIENT_SECRET, or MAIL_FROM in .env'
        );
        console.error(_initError.message);
        return;
    }

    try {
        _credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

        _client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: async () => {
                    const token = await _credential.getToken(
                        'https://graph.microsoft.com/.default'
                    );
                    return token.token;
                },
            },
        });

        console.log('Graph mailer initialised — sending from:', _fromAddress);
    } catch (err) {
        _initError = err;
        console.error('Graph mailer init failed:', err.message);
    }
}

// ----------------------------------------------------------
// sendMail — the single entry point used by emailService.js
// ----------------------------------------------------------
async function sendMail({ to, subject, html, text, replyTo }) {
    init();
    if (!_client) {
        throw new Error(
            _initError?.message || 'Graph mailer not initialised. Check .env and restart the server.'
        );
    }

    const recipients = (Array.isArray(to) ? to : [to]).map((address) => ({
        emailAddress: { address },
    }));

    const message = {
        subject,
        body: {
            contentType: text && !html ? 'Text' : 'HTML',
            content: html || text || '',
        },
        toRecipients: recipients,
    };

    if (replyTo) {
        message.replyTo = [{ emailAddress: { address: replyTo } }];
    }

    try {
        await _client
            .api(`/users/${_fromAddress}/sendMail`)
            .post({ message, saveToSentItems: true });

        console.log(`Graph sendMail success to ${to}`);
        return { success: true };
    } catch (err) {
        const status = err.statusCode || err.status || 0;
        console.error(`Graph sendMail error: ${status} - ${err.message || '(no message)'}`);
        
        // Log the full error body from Microsoft to see exactly what's wrong
        if (err.body) {
            try {
                const body = typeof err.body === 'string' ? JSON.parse(err.body) : err.body;
                console.error('Graph Error Body:', JSON.stringify(body, null, 2));
            } catch {
                console.error('Graph Error Body (raw):', err.body);
            }
        }
        
        throw err;
    }
}

module.exports = { sendMail };