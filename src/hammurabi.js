function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const HAMURABI = {
  // Game state variables
  year: 0,
  population: 95,
  acres: 1000,
  grain: 2800,
  bushelsPerAcre: 3,
  deathsThisYear: 0,
  totalDeaths: 0,
  immigrants: 5,
  plague: 1, // 1 = no plague, 0 = plague
  acresPlanted: 0, // Add a variable to track planted acres

  // Game statistics
  totalStarved: 0,
  percentageStarved: 0,

  // Messages
  introMessage:
    "TRY YOUR HAND AT GOVERNING ANCIENT SUMERIA FOR A TEN-YEAR TERM OF OFFICE. \n",
  reportMessage: "HAMURABI:  I BEG TO REPORT TO YOU,",
  plagueMessage: "A HORRIBLE PLAGUE STRUCK!  HALF THE PEOPLE DIED.",
  gameOverMessage: "GET YOURSELF ANOTHER STEWARD!!!!!",
  notEnoughGrainMessage:
    "HAMURABI:  THINK AGAIN.  YOU HAVE ONLY {grain} BUSHELS OF GRAIN.  NOW THEN,",
  notEnoughLandMessage:
    "HAMURABI:  THINK AGAIN.  YOU OWN ONLY {acres} ACRES.  NOW THEN,",

  // Initialize the game
  initialize: function () {
    this.showMessage(this.introMessage);
    this.nextYear();
  },

  // Advance to the next year
  nextYear: async function () {
    this.year++;
    this.report();
    if (this.year === 11) {
      this.endGame();
      return;
    }
    this.calculateLandPrice();
    await this.buyOrSellLand();
    await this.feedPeople();
    await this.plantCrops();
    this.harvest();
    this.calculatePopulationChanges();
    this.nextYear();
  },

  // Display the yearly report
  report: function () {
    this.showMessage(this.reportMessage);
    this.showMessage(
      `IN YEAR ${this.year}, ${this.deathsThisYear} PEOPLE STARVED, ${this.immigrants} CAME TO THE CITY,`
    );
    this.population += this.immigrants;
    if (!this.plague) {
      this.population = Math.floor(this.population / 2);
      this.showMessage(this.plagueMessage);
    }
    this.showMessage(`POPULATION IS NOW ${this.population}`);
    this.showMessage(`THE CITY NOW OWNS ${this.acres} ACRES.`);
    this.showMessage(`YOU HARVESTED ${this.bushelsPerAcre} BUSHELS PER ACRE.`);
    const ratsAte = this.calculateRats();
    this.showMessage(`THE RATS ATE ${ratsAte} BUSHELS.`);
    this.grain = this.grain - ratsAte + this.bushelsPerAcre * this.acresPlanted;
    this.showMessage(`YOU NOW HAVE ${this.grain} BUSHELS IN STORE.\n`);
  },

  // Calculate the land price
  calculateLandPrice: function () {
    this.bushelsPerAcre = getRandomInt(10) + 17;
    this.showMessage(
      `LAND IS TRADING AT ${this.bushelsPerAcre} BUSHELS PER ACRE.`
    );
  },

  // Handle buying or selling land
  buyOrSellLand: async function () {
    let acresToBuy = await this.getInput("HOW MANY ACRES DO YOU WISH TO BUY? ");
    if (acresToBuy < 0) {
      this.showMessage("INVALID INPUT. PLEASE ENTER A NON-NEGATIVE NUMBER.");
      await this.buyOrSellLand(); // Re-prompt the user
      return;
    }
    if (this.bushelsPerAcre * acresToBuy > this.grain) {
      this.showMessage(this.notEnoughGrainMessage);
      await this.buyOrSellLand(); // Try again
      return;
    }
    if (acresToBuy === 0) {
      // Selling land
      let acresToSell = await this.getInput(
        "HOW MANY ACRES DO YOU WISH TO SELL? "
      );
      if (acresToSell < 0) {
        this.showMessage("INVALID INPUT. PLEASE ENTER A NON-NEGATIVE NUMBER.");
        await this.buyOrSellLand(); // Re-prompt the user
        return;
      }
      if (acresToSell > this.acres) {
        this.showMessage(this.notEnoughLandMessage);
        await this.buyOrSellLand(); // Try again
        return;
      }
      this.acres -= acresToSell; // Deduct sold acres
      this.grain += this.bushelsPerAcre * acresToSell;
    } else {
      // Buying land
      this.acres += acresToBuy;
      this.grain -= this.bushelsPerAcre * acresToBuy;
    }
  },

  // Handle feeding the people
  feedPeople: async function () {
    let bushelsToFeed = await this.getInput(
      "HOW MANY BUSHELS DO YOU WISH TO FEED YOUR PEOPLE? "
    );
    if (bushelsToFeed < 0) {
      this.showMessage("INVALID INPUT. PLEASE ENTER A NON-NEGATIVE NUMBER.");
      await this.feedPeople(); // Re-prompt the user
      return;
    }
    if (bushelsToFeed > this.grain) {
      this.showMessage(this.notEnoughGrainMessage);
      await this.feedPeople(); // Try again
      return;
    }
    this.grain -= bushelsToFeed;
    this.calculatePopulationChanges(bushelsToFeed);
  },

  // Handle planting crops
  plantCrops: async function () {
    let acresToPlant = await this.getInput(
      "HOW MANY ACRES DO YOU WISH TO PLANT WITH SEED? "
    );
    if (acresToPlant === 0) {
      return;
    }
    if (acresToPlant < 0) {
      this.showMessage("INVALID INPUT. PLEASE ENTER A NON-NEGATIVE NUMBER.");
      await this.plantCrops(); // Re-prompt the user
      return;
    }
    if (acresToPlant > this.acres) {
      // Prevent planting more than owned
      this.showMessage(this.notEnoughLandMessage);
      await this.plantCrops(); // Try again
      return;
    }
    if (Math.floor(acresToPlant / 2) > this.grain) {
      this.showMessage(this.notEnoughGrainMessage);
      await this.plantCrops(); // Try again
      return;
    }
    if (acresToPlant >= 10 * this.population) {
      this.showMessage(
        `BUT YOU HAVE ONLY ${this.population} PEOPLE TO TEND THE FIELDS!  NOW THEN,`
      );
      await this.plantCrops(); // Try again
      return;
    }
    this.grain -= Math.floor(acresToPlant / 2);
    this.acresPlanted = acresToPlant; // Update the acresPlanted variable
  },

  // Handle harvesting crops
  harvest: function () {
    this.bushelsPerAcre = getRandomInt(5) + 1;
    let harvest = this.acresPlanted * this.bushelsPerAcre; // Calculate harvest based on planted acres
    let ratsAte = this.calculateRats();
    this.grain = this.grain - ratsAte + harvest;
  },

  // Calculate how much grain the rats eat
  calculateRats: function () {
    let random = getRandomInt(5) + 1;
    if (Math.floor(random / 2) !== random / 2) {
      return Math.min(Math.floor(this.grain / random), this.grain);
    } else {
      return 0;
    }
  },

  // Calculate population changes (births, deaths, plague)
  calculatePopulationChanges: function (bushelsToFeed) {
    // Use acresPlanted for immigrants calculation, as it reflects the cultivated land
    this.immigrants = Math.floor(
      (this.bushelsPerAcre * (20 * this.acresPlanted + this.grain)) /
        Math.max(this.population, 1) / // Prevent division by zero
        100 +
        1
    );
    let peopleFed = Math.floor(bushelsToFeed / 20);
    this.plague = Math.floor(10 * (2 * Math.random() - 0.3));

    if (this.population < peopleFed) {
      this.deathsThisYear = 0;
      return;
    }

    this.deathsThisYear = this.population - peopleFed;

    // Prevent population from becoming zero
    if (this.deathsThisYear > 0.45 * this.population) {
      this.deathsThisYear = Math.floor(0.45 * this.population);
    }

    // Ensure population is not zero before calculating percentage
    if (this.population > 0) {
      this.percentageStarved =
        ((this.year - 1) * this.percentageStarved +
          (this.deathsThisYear * 100) / this.population) /
        this.year;
    } else {
      this.percentageStarved = 100; // If everyone starved, percentage is 100
    }

    this.population = Math.max(this.population - this.deathsThisYear, 1);
    this.totalStarved += this.deathsThisYear;
  },

  // Handle impeachment
  impeach: function () {
    this.showMessage(
      `\nYOU STARVED ${this.deathsThisYear} PEOPLE IN ONE YEAR!!!`
    );
    this.showMessage("DUE TO THIS EXTREME MISMANAGEMENT YOU HAVE NOT ONLY");
    this.showMessage("BEEN IMPEACHED AND THROWN OUT OF OFFICE BUT YOU HAVE");
    this.showMessage("ALSO BEEN DECLARED NATIONAL FINK!!!!");
    this.endGame();
  },

  // End the game and display the summary
  endGame: function () {
    this.showMessage(
      `IN YOUR 10-YEAR TERM OF OFFICE, ${this.percentageStarved.toFixed(
        2
      )} PERCENT OF THE`
    );
    this.showMessage(
      "POPULATION STARVED PER YEAR ON THE AVERAGE, I.E. A TOTAL OF"
    );
    this.showMessage(`${this.totalStarved} PEOPLE DIED!!`);
    let landPerPerson = this.acres / this.population;
    this.showMessage("YOU STARTED WITH 10 ACRES PER PERSON AND ENDED WITH");
    this.showMessage(`${landPerPerson.toFixed(2)} ACRES PER PERSON.\n`);

    if (this.percentageStarved > 33 || landPerPerson < 7) {
      this.showMessage("DUE TO THIS EXTREME MISMANAGEMENT YOU HAVE NOT ONLY");
      this.showMessage("BEEN IMPEACHED AND THROWN OUT OF OFFICE BUT YOU HAVE");
      this.showMessage("ALSO BEEN DECLARED NATIONAL FINK!!!!");
    } else if (this.percentageStarved > 10 || landPerPerson < 9) {
      this.showMessage(
        "YOUR HEAVY-HANDED PERFORMANCE SMACKS OF NERO AND IVAN IV."
      );
      this.showMessage(
        "THE PEOPLE (REMIANING) FIND YOU AN UNPLEASANT RULER, AND,"
      );
      this.showMessage("FRANKLY, HATE YOUR GUTS!!");
    } else if (this.percentageStarved > 3 || landPerPerson < 10) {
      this.showMessage("YOUR PERFORMANCE COULD HAVE BEEN SOMEWHAT BETTER, BUT");
      this.showMessage(
        "REALLY WASN'T TOO BAD AT ALL. " +
          Math.floor(this.population * 0.8 * Math.random()) +
          " PEOPLE"
      );
      this.showMessage(
        "WOULD DEARLY LIKE TO SEE YOU ASSASSINATED BUT WE ALL HAVE OUR"
      );
      this.showMessage("TRIVIAL PROBLEMS.");
    } else {
      this.showMessage(
        "A FANTASTIC PERFORMANCE!!!  CHARLEMANGE, DISRAELI, AND"
      );
      this.showMessage("JEFFERSON COMBINED COULD NOT HAVE DONE BETTER!");
    }

    this.showMessage("\n");
    this.showMessage("SO LONG FOR NOW.\n");
  },

  // Display a message to the player
  showMessage: function (message) {
    const outputDiv = document.getElementById("game-output");
    const formattedMessage = message
      .replace("{grain}", this.grain)
      .replace("{acres}", this.acres);
    outputDiv.innerHTML += formattedMessage + "\n";
    outputDiv.scrollTop = outputDiv.scrollHeight;
  },

  getInput: function (promptText) {
    return new Promise((resolve) => {
      const outputDiv = document.getElementById("game-output");
      const inputField = document.getElementById("user-input");
      this.showMessage(promptText);

      const handleInput = (event) => {
        if (event.key === "Enter") {
          const value = parseInt(inputField.value);
          outputDiv.innerHTML += value + "\n\n";
          inputField.value = "";
          inputField.removeEventListener("keydown", handleInput);
          resolve(value);
        }
      };

      inputField.addEventListener("keydown", handleInput);
    });
  },

  // End the game due to invalid input
  gameOver: function () {
    this.showMessage("\n" + this.gameOverMessage);
    this.endGame();
  },
};

// Start the game
HAMURABI.initialize();
