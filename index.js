let fs = require('fs');
let readline = require('readline');
let stream = require('stream');
let request = require('request');
let cheerio = require('cheerio');
let instream = fs.createReadStream('./reviews.csv');
let outstream = new stream;
let rl = readline.createInterface(instream, outstream);
let links = [];
let count = 0;

function scrapLink(slugName) {

  request(`http://webcache.googleusercontent.com/search?q=cache:https://www.belezanaweb.com.br/${slugName}`, function(err, response, body) {
    if (err) {
      nextLink();
      return console.error(err);
    }

    if (response.statusCode >= 400) {
      nextLink();
      return console.error(`${slugName} not found`);
    }

    if (response.statusCode === 200) {
      $ = cheerio.load(body);
      let reviews = [];
      let $reviews = $('#product-reviews .review');

      if (!$reviews.length) {
        return console.error(`${slugName} not found`);
      }

      ($reviews || []).each(function() {
        let $this = $(this);
        let review = {
          date_created: $this.find('[itemprop="dateCreated"]').attr('content'),
          id: $this.find('.js-reviews-upvote').attr('data-id'),
          downvote_count: $this.find('.js-reviews-downvote span').text(),
          upvote_count: $this.find('.js-reviews-upvote span').text(),
          review_body: $this.find('.review-text').text().trim(),
          rating_value: $this.find('[itemprop="ratingValue"]').attr('content'),
          sku: $this.find('[itemprop="sku"]').attr('content'),
          compositionId: $('#reviewsForm').attr('data-compositionid')
        };

        reviews.push(review);
      });

      saveJSON(`./reviews/${slugName}.json`, reviews);

    }

  });

}


rl.on('line', function(line) {
  links.push(line.split(',')[1].trim());
});

rl.on('close', nextLink);

function nextLink() {
  scrapLink(links[count]);
  count++;
}

function saveJSON(file, data, cb) {
  fs.writeFile(file, JSON.stringify(data), function(err) {
    nextLink();
    if (err) {
      return console.error(err);
    }

    console.log(`${file} created`);
  });
}
