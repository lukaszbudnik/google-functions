exports.helloHttp = function helloHttp (req, res) {
  console.log(req.headers);
  var greeting = { greeting: `Hello ${req.body.name || 'World'}!` };
  res.json(greeting);
};
