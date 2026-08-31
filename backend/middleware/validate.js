const { validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        for (const validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length) break;
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) return next();

        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(({ param, msg }) => ({ field: param, message: msg }))
        });
    };
};

module.exports = validate;
