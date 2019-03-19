FROM arm32v7/node

EXPOSE 3000

ENV NODE_ENV production

WORKDIR /app
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install --production
RUN npm install raspi raspi-serial
ADD dist dist

CMD ["npm", "start"]
