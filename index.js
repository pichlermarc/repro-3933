const {NodeSDK} = require( "@opentelemetry/sdk-node");
const {getNodeAutoInstrumentations} = require( "@opentelemetry/auto-instrumentations-node");
const {SemanticResourceAttributes} = require( "@opentelemetry/semantic-conventions");
const {Resource} = require( "@opentelemetry/resources");
const {diag, DiagConsoleLogger, DiagLogLevel, trace, context} = require( "@opentelemetry/api");
const {OTLPTraceExporter} = require("@opentelemetry/exporter-trace-otlp-grpc");


const sdk = new NodeSDK({
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-grpc': { enabled: false },
        }),
    ],
    traceExporter: new OTLPTraceExporter(),
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'OurService',
        [SemanticResourceAttributes.SERVICE_VERSION]: 'SomeVersion',
        [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: 'SomeInstanceId',
    }),
})
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

try {
    sdk.start()
    diag.info(`OpenTelemetry tracing enabled.`)
} catch (err) {
    diag.error('Failed to enable OpenTelemetry')
}

const tracer = trace.getTracer('example');

// Create a span. A span must be closed.
const parentSpan = tracer.startSpan('main');
for (let i = 0; i < 10; i += 1) {
    doWork(parentSpan);
}
// Be sure to end the span.
parentSpan.end();

// give some time before it is closed
setTimeout(() => {
    // flush and close the connection.
    sdk.shutdown();
}, 2000);

function doWork(parent) {
    // Start another span. In this example, the main method already started a
    // span, so that'll be the parent span, and this will be a child span.
    const ctx = trace.setSpan(context.active(), parent);
    const span = tracer.startSpan('doWork', undefined, ctx);

    // simulate some random work.
    for (let i = 0; i <= Math.floor(Math.random() * 40000000); i += 1) {
        // empty
    }
    // Set attributes to the span.
    span.setAttribute('key', 'value');

    // end span
    span.end();
}
