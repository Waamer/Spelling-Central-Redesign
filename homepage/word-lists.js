(function () {
  const baseLibraries = [
    {
      id: "animals-easy",
      title: "Animals - Easy",
      category: "animals",
      difficulty: "easy",
      words: [
        "cat","dog","pig","cow","hen","duck","bird","fish","frog","bee","ant","bat","fox","rat","owl",
        "lion", "tiger", "sheep", "bear", "deer", "panda", "shark", "wolf"
      ]
    },
    {
      id: "animals-medium",
      title: "Animals - Medium",
      category: "animals",
      difficulty: "medium",
      words: [
        "horse","goat","zebra","camel","monkey","rabbit","donkey","turtle","pigeon","parrot","eagle",
        "swan","dolphin","whale","seal","octopus","crab","lobster","snail","spider","lizard","penguin"
      ]
    },
    {
      id: "animals-hard",
      title: "Animals - Hard",
      category: "animals",
      difficulty: "hard",
      words: [
        "elephant","giraffe","kangaroo","dinosaur","butterfly","caterpillar","alligator","chimpanzee","rhinoceros",
        "seahorse","jellyfish","starfish","peacock","flamingo","ostrich","armadillo","squirrel","hamster","raccoon",
        "leopard","cheetah","gorilla"
      ]
    },
    {
      id: "food-easy",
      title: "Food - Easy",
      category: "food",
      difficulty: "easy",
      words: [
        "apple", "bread", "rice", "milk", "water", "grape", "pizza", "soup", "cake", "cheese",
        "banana", "cookie", "orange", "noodle", "carrot", "tomato", "butter", "jam", "egg", "salad"
      ]
    },
    {
      id: "food-medium",
      title: "Food - Medium",
      category: "food",
      difficulty: "medium",
      words: [
        "burger","sandwich","sausage","chicken","beef","pork","shrimp","fries","pancake","waffle",
        "dumpling","potato","mushroom","cereal","honey","yogurt","peanut","almond","lettuce","cabbage",
        "pepper","onion", "sushi"
      ]
    },
    {
      id: "food-hard",
      title: "Food - Hard",
      category: "food",
      difficulty: "hard",
      words: [
        "avocado","pineapple","strawberry","blueberry","watermelon","chocolate","hamburger","mayonnaise",
        "ketchup","mustard","broccoli","cauliflower","asparagus","eggplant","cucumber","zucchini","spinach",
        "vanilla","omelette","croissant","pumpkin", "spaghetti"
      ]
    },
    {
      id: "nature-easy",
      title: "Nature - Easy",
      category: "nature",
      difficulty: "easy",
      words: [
        "tree", "leaf", "rock", "rain", "snow", "cloud", "wind", "river", "beach", "grass",
        "plant", "flower", "sun", "moon", "lake", "forest", "hill", "storm", "earth", "stone"
      ]
    },
    {
      id: "nature-medium",
      title: "Nature - Medium",
      category: "nature",
      difficulty: "medium",
      words: [
        "sunrise", "sunset", "volcano", "waterfall", "thunder", "meadow", "valley", "desert", "canyon", "rainbow",
        "breeze", "climate", "glacier", "prairie", "lightning", "mountain", "hurricane", "season", "ocean", "wildlife"
      ]
    },
    {
      id: "nature-hard",
      title: "Nature - Hard",
      category: "nature",
      difficulty: "hard",
      words: [
        "ecosystem", "atmosphere", "earthquake", "tornado", "temperature", "hemisphere", "peninsula", "island", "avalanche", "drought",
        "flooding", "rainforest", "sandstorm", "moonlight", "sunlight", "starlight", "riverbank", "coastline", "nationalpark", "conservation"
      ]
    },
    {
      id: "school-easy",
      title: "School - Easy",
      category: "school",
      difficulty: "easy",
      words: [
        "book", "desk", "pen", "pencil", "paper", "class", "teacher", "student", "ruler", "lunch",
        "table", "chair", "eraser", "crayon", "folder", "glue", "clock", "board", "recess", "bag"
      ]
    },
    {
      id: "school-medium",
      title: "School - Medium",
      category: "school",
      difficulty: "medium",
      words: [
        "science", "history", "library", "notebook", "backpack", "project", "grammar", "reading", "spelling", "math",
        "subject", "schedule", "homework", "cafeteria", "calculator", "assignment", "classroom", "dictionary", "practice", "question"
      ]
    },
    {
      id: "school-hard",
      title: "School - Hard",
      category: "school",
      difficulty: "hard",
      words: [
        "curriculum", "laboratory", "presentation", "experiment", "multiplication", "subtraction", "technology", "microscope", "pronunciation", "vocabulary",
        "investigation", "instruction", "assessment", "collaboration", "geography", "mathematics", "explanation", "comprehension", "responsibility", "communication"
      ]
    },
    {
      id: "space-hard",
      title: "Space - Hard",
      category: "space",
      difficulty: "hard",
      words: [
        "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "planet",
        "orbit", "galaxy", "asteroid", "comet", "meteor", "eclipse", "gravity", "telescope", "satellite", "astronaut",
        "spaceship", "moonlight"
      ]
    }
  ];

  window.wordLibraryData = {
    baseLibraries
  };
})();
