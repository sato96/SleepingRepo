// This script executes once after a message has been processed
// Responses returned from here will be stored as "Postprocessor" in the response map

// Return an OperationOutcome if no destinations or anything else already handled the response
if (!responseMap.containsKey('response')) {
	if (sourceMap.get('fhirInteraction') == 'operation') {
		createOperationOutcome('error', 'processing', 'Invalid or unsupported operation: ' + sourceMap.get('fhirOperationName'), 400, 'R4');
	} else {
		createOperationOutcome('error', 'processing', 'Invalid request URI.', 400, 'R4');
	}
}
return;
