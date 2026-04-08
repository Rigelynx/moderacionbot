export function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

export function logSuccess(message) {
    console.log(`✅ ${message}`);
}

export function logWarning(message) {
    console.log(`⚠️  ${message}`);
}

export function logError(message) {
    console.log(`❌ ${message}`);
}

export function handleError(context, error) {
    console.error(`❌ ${context}: ${error.message || error}`);
    if (error.stack) {
        console.error(error.stack);
    }
}
