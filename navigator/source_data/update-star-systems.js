const systemsList = require('../src/app/systemsList.json')
const jumpLinks = require('../src/app/jumpLinks.json');
const starSystems = require('../src/app/star-systems.json');
const fs = require("fs");

// Scratch to update discovered jump links.
// Delete hand-added jump links. RIP
starSystems.forEach(starSystem => starSystem.jumpLinks = []);

jumpLinks.forEach(jumpLink => {
  const originId = jumpLink.bridge[0];
  const originFilter = systemsList.filter(item => item.id === originId);
  const originName = originFilter.length === 1 ? originFilter[0].sysName : undefined;

  const destinationId = jumpLink.bridge[1];
  const destinationFilter = systemsList.filter(item => item.id === destinationId);
  const destinationName = destinationFilter.length === 1 ? destinationFilter[0].sysName : undefined;

  const originData = starSystems.filter(starSystem => starSystem.name === originName);
  const destinationData = starSystems.filter(starSystems => starSystems.name === destinationName);


  if (originName === undefined || destinationName === undefined || originData.length !== 1 || destinationData.length !== 1) {
    console.log(`Error for Origin ID: ${originId} ${originName} Destination ID: ${destinationId} ${destinationName}`);
  } else {
    let jumpLevel;
    if (jumpLink.type === "A") jumpLevel = "Alpha";
    if (jumpLink.type === "B") jumpLevel = "Beta";
    if (jumpLink.type === "G") jumpLevel = "Gamma";
    if (jumpLink.type === "D") jumpLevel = "Delta";
    if (jumpLink.type === "E") jumpLevel = "Epsilon";

    originData[0].jumpLinks.push({
      "destination": destinationName,
      "jumpLevel": jumpLevel,
      "discovered": jumpLink.year
    });

    destinationData[0].jumpLinks.push({
      "destination": originName,
      "jumpLevel": jumpLevel,
      "discovered": jumpLink.year
    });
  }
});

fs.writeFile('../src/app/out.json', JSON.stringify(starSystems), (error) => {
  if (error) {
    console.error(error);
    throw error;
  }
});

// Scratch to update coordinates.
//
// const output = starSystems.map(starSystem => {
//   let updated = starSystem;
//
//   let matchingSystems = systemsList.filter(system => system.sysName === starSystem.name);
//   if (matchingSystems.length === 1) {
//     updated.coordinates = {
//       x: matchingSystems[0].x,
//       y: matchingSystems[0].y,
//       z: matchingSystems[0].z
//     }
//   }
//
//   return updated;
// });
//
// fs.writeFile('../src/app/out.json', JSON.stringify(output), (error) => {
//   if (error) {
//     console.error(error);
//     throw error;
//   }
// });
