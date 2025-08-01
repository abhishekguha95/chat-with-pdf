import fetch from 'node-fetch'; // For Node.js environments

/**
 * Main function to query the Ollama API using streaming responses
 * Handles real-time token generation from local Ollama instance
 */
async function queryLLMStream() {
	const url = "http://localhost:11434/api/generate"; // Default Ollama API endpoint

	try {
		// Send POST request to Ollama API with streaming enabled
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gemma3",
				prompt: "how can i run bigger models using ollama on my laptop if i have limited resources like only 16gb ram and no gpu",
				stream: true, // Enable streaming responses for real-time output
			}),
		});

		// Validate HTTP response
		if (!response.ok) {
			console.error(`HTTP error! Status: ${response.status}`);
			const errorText = await response.text();
			console.error("Error response:", errorText);
			return;
		}

		// Get readable stream from response
		const nodeStream = response.body;
		if (!nodeStream) {
			console.error("Response body is null or not a readable stream.");
			return;
		}

		// Initialize stream processing variables
		const decoder = new TextDecoder("utf-8"); // For decoding stream chunks
		let accumulatedData = ""; // Buffer for incomplete JSON lines
		let fullResponseText = ""; // Collects the complete response text

		// Process each chunk from the stream
		for await (const chunk of nodeStream) {
			// Decode chunk and add to accumulated buffer
			accumulatedData += decoder.decode(chunk, { stream: true });

			// Split into lines - each line contains a JSON object
			const lines = accumulatedData.split("\n");
			// Keep incomplete line for next iteration
			accumulatedData = lines.pop() || "";

			// Process each complete line
			for (const line of lines) {
				if (line.trim() === "") continue; // Skip empty lines

				try {
					// Parse JSON response chunk
					const chunkObj = JSON.parse(line);
					
					// Accumulate response text
					if (chunkObj.response) {
						fullResponseText += chunkObj.response;
					}
					
					// Process chunk in real-time
					processChunk(chunkObj);

					// Check if streaming is complete
					if (chunkObj.done) {
						console.log("Full response received (done=true).");
						// Stream completion - could break here if needed
					}
				} catch (e) {
					// Handle malformed JSON chunks
					console.error("Error parsing JSON line:", e);
					console.error("Problematic line:", line);
				}
			}
		}

		// Handle any remaining data after stream ends
		if (accumulatedData.trim() !== "") {
			try {
				const finalChunk = JSON.parse(accumulatedData);
				if (finalChunk.response) {
					fullResponseText += finalChunk.response;
					processChunk(finalChunk);
				}
			} catch (e) {
				console.error("Error parsing final accumulated data:", e);
				console.error("Problematic data:", accumulatedData);
			}
		}

		console.log("Stream finished.");

		// Display complete generated response
		console.log("\n--- Full Generated Response ---");
		console.log(fullResponseText);

	} catch (error) {
		// Handle network errors and other exceptions
		console.error("Failed to fetch from Ollama:", error);
	}
}

/**
 * Process individual chunks from the Ollama streaming response
 * Handles real-time display and metadata logging
 * 
 * @param {Object} chunk - Individual response chunk from Ollama
 * @param {string} chunk.model - Model name used
 * @param {string} chunk.created_at - Timestamp of chunk creation
 * @param {string} chunk.response - Text content of this chunk
 * @param {boolean} chunk.done - Whether streaming is complete
 * @param {number} [chunk.total_duration] - Total processing duration in nanoseconds
 * @param {number} [chunk.eval_count] - Number of tokens evaluated
 */
function processChunk(chunk) {
	// Display tokens in real-time as they arrive
	if (chunk.response) {
		process.stdout.write(chunk.response); // Print without newline for continuous output
	}

	// Log performance metadata when streaming completes
	if (chunk.done) {
		const totalSeconds = chunk.total_duration ? chunk.total_duration / 1e9 : "N/A";
		console.log(`\n[Metadata] Total duration: ${totalSeconds} seconds`);
		
		// Additional metadata available in chunk:
		// - load_duration: Model loading time
		// - prompt_eval_count: Tokens in prompt
		// - prompt_eval_duration: Prompt processing time
		// - eval_count: Generated tokens
		// - eval_duration: Generation time
	}
}

// Execute the streaming query
queryLLMStream();