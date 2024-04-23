
function doSomething(span) {
  span.startChild();
}

function doSomethingElse() {
  const transaction = Sentry.getActiveSpan();
  transaction.startChild().end();
  transaction.finish();
}
