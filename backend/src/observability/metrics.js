const {
    Counter,
    Gauge,
    Histogram,
    Registry,
    collectDefaultMetrics
} = require('@prometheus-io/client');

const registry = new Registry();
registry.setDefaultLabels({ service: 'messmate-api' });
collectDefaultMetrics({ register: registry, prefix: 'messmate_api_' });

const httpRequestsTotal = new Counter({
    name: 'messmate_http_requests_total',
    help: 'Total number of HTTP requests handled by the MessMate API',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry]
});

const httpRequestDurationSeconds = new Histogram({
    name: 'messmate_http_request_duration_seconds',
    help: 'MessMate API request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry]
});

const databaseHealthy = new Gauge({
    name: 'messmate_database_healthy',
    help: 'Whether the last MessMate database health check succeeded (1) or failed (0)',
    registers: [registry]
});

const normalizeRoute = (req) => {
    if (req.route?.path) return `${req.baseUrl || ''}${req.route.path}`;
    if (req.path === '/api/health') return '/api/health';
    return 'unmatched';
};

const observeHttpRequest = (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
        const labels = {
            method: req.method,
            route: normalizeRoute(req),
            status_code: String(res.statusCode)
        };

        httpRequestsTotal.inc(labels);
        httpRequestDurationSeconds.observe(labels, durationSeconds);
    });

    next();
};

const renderMetrics = async (req, res, next) => {
    try {
        res.set('Content-Type', registry.contentType);
        return res.send(await registry.metrics());
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    databaseHealthy,
    observeHttpRequest,
    renderMetrics
};
