import App from './app/app.js';

const app: App = new App();
app.init(8080).then(() => {
  app.start();
});
