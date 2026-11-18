import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log(
    `muse-drill-rest-api listening on http://localhost:${config.port}`,
  );
});
