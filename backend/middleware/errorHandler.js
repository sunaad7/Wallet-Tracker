const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Server error';

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate value — that record already exists';
    }

    if (err.name === 'UnauthorizedError' || statusCode === 401) {
        message = err.message || 'Not authorized';
    }

    if (statusCode >= 500) {
        console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    }

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {})
    });
};

module.exports = { notFound, errorHandler };
