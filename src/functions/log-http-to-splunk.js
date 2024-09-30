const { app } = require('@azure/functions');

const token = process.env.SPLUNK_TOKEN;
const uri = process.env.HEC_URI;
const sourceType = '_json';
const host = process.env.SOURCE_HOST || 'veza';
const index = process.env.HEC_INDEX || 'main';
const nodeTlsRejectUnauthorized = (process.env.IGNORE_SELF_SIGNED_CERT || 'false').toLowerCase() == 'true' ? 0 : 1;

app.http('log-http-to-splunk', {
    methods: ['POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        const requestBody = await request.json();

        const body = {
            event: requestBody,
            sourceType: sourceType,
            host: host,
            index: index
        }
        const headers = {
            'content-type': 'application/json',
            'Authorization': `Splunk ${token}`
        }

        try {
            context.info(`Sending to Splunk: ${uri}`);
            
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = nodeTlsRejectUnauthorized;

            let res = await fetch(uri, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (res.status == 200) {
                res = await res.json();
                return {
                    body: JSON.stringify(res)
                }
            } else {
                return {
                    status: res.status,
                    body: res.statusText
                }
            }
        } catch (e) {
            context.error(e);
            return {
                status: 400,
                body: e
            }
        }

    }
});
