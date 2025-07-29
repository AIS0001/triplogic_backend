// Middleware to handle uncaught errors and unhandled promise rejections
function errorHandlerMiddleware(err, req, res, next) {
    console.error('Unhandled Error:', err);
    res.status(500).send('Internal Server Error');
  }
  
  // Process event listeners for uncaught exceptions and unhandled promise rejections
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); // Exit the process with an error code
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    // Optionally, you can log the stack trace of the promise:
    // console.error(reason.stack);
  });