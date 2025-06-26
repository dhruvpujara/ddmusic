exports.pageNotFound = (req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    isLoggedIn: req.session.isLoggedIn || false
  });
};