(function () {
  const baseLibraries = [
    {
      id: "animals",
      title: "Animals",
      words: ["lion", "tiger", "zebra", "rabbit", "monkey", "panda", "koala", "eagle", "shark", "otter"]
    },
    {
      id: "food",
      title: "Food",
      words: ["pizza", "salad", "noodle", "soup", "bread", "cheese", "cookie", "orange", "grape", "carrot"]
    },
    {
      id: "space",
      title: "Space",
      words: ["planet", "orbit", "meteor", "galaxy", "rocket", "astronaut", "comet", "satellite", "nebula", "eclipse"]
    },
    {
      id: "school",
      title: "School",
      words: ["teacher", "student", "homework", "notebook", "eraser", "marker", "science", "history", "classroom", "recess"]
    },
    {
      id: "weather",
      title: "Weather",
      words: ["sunny", "cloudy", "rainy", "stormy", "windy", "foggy", "thunder", "snowfall", "drizzle", "forecast"]
    }
  ];

  window.wordLibraryData = {
    baseLibraries
  };
})();
