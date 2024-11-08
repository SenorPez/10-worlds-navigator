const systemsList = require('../src/app/systemsList.json')
const jumpLinks = require('../src/app/jumpLinks.json');
const starSystems = require('../src/app/star-systems.json');
const fs = require("fs");

// Scratch to add undiscovered but possible links.
const originSystems = require('../src/app/star-systems.json');
const destinationSystems = require('../src/app/star-systems.json');

originSystems.forEach(originSystem => {
  const existingDestinations = originSystem.jumpLinks.map(jumpLink => jumpLink.destination);

  destinationSystems
    .filter(destinationSystem => originSystem.name !== destinationSystem.name)
    .forEach(destinationSystem => {
      const distance = Math.sqrt(
        Math.pow(originSystem.coordinates.x - destinationSystem.coordinates.x, 2) +
        Math.pow(originSystem.coordinates.y - destinationSystem.coordinates.y, 2) +
        Math.pow(originSystem.coordinates.z - destinationSystem.coordinates.z, 2)
      );
      let jumpLevel = "None"
      const roundDistance = Math.round(distance * 10) / 10;
      if (roundDistance === 0.6) jumpLevel = "Alpha";
      if (roundDistance >= 0.9 && roundDistance <= 1.0) jumpLevel = "Beta";
      if (roundDistance >= 1.5 && roundDistance <= 1.7) jumpLevel = "Gamma";
      if (roundDistance >= 2.4 && roundDistance <= 2.7) jumpLevel = "Delta";
      if (roundDistance >= 3.9 && roundDistance <= 4.4) jumpLevel = "Epsilon";

      if (existingDestinations.includes(destinationSystem.name)) {
        const destinationData = originSystem.jumpLinks.filter(jumpLink => jumpLink.destination === destinationSystem.name)[0];
        if (destinationData.jumpLevel !== jumpLevel) console.log(`Jump Level Mismatch: ${originSystem.name} to ${destinationSystem.name}, ${destinationData.jumpLevel} should be ${jumpLevel} (Distance: ${distance})`);
        else {
          destinationData.distance = distance;
        }
      } else if (jumpLevel !== "None") {
        originSystem.jumpLinks.push({
          "destination": destinationSystem.name,
          "jumpLevel": jumpLevel,
          "discovered": null,
          "distance": distance
        });

        destinationSystem.jumpLinks.push({
          "destination": originSystem.name,
          "jumpLevel": jumpLevel,
          "discovered": null,
          "distance": distance
        });
      }
    });
});

fs.writeFile('../app/out.json', JSON.stringify(starSystems), (error) => {
  if (error) {
    console.error(error);
    throw error;
  }
});



// Scratch to update discovered jump links.
// Delete hand-added jump links. RIP
// starSystems.forEach(starSystem => starSystem.jumpLinks = []);
//
// jumpLinks.forEach(jumpLink => {
//   const originId = jumpLink.bridge[0];
//   const originFilter = systemsList.filter(item => item.id === originId);
//   const originName = originFilter.length === 1 ? originFilter[0].sysName : undefined;
//
//   const destinationId = jumpLink.bridge[1];
//   const destinationFilter = systemsList.filter(item => item.id === destinationId);
//   const destinationName = destinationFilter.length === 1 ? destinationFilter[0].sysName : undefined;
//
//   const originData = starSystems.filter(starSystem => starSystem.name === originName);
//   const destinationData = starSystems.filter(starSystems => starSystems.name === destinationName);
//
//
//   if (originName === undefined || destinationName === undefined || originData.length !== 1 || destinationData.length !== 1) {
//     console.log(`Error for Origin ID: ${originId} ${originName} Destination ID: ${destinationId} ${destinationName}`);
//   } else {
//     let jumpLevel;
//     if (jumpLink.type === "A") jumpLevel = "Alpha";
//     if (jumpLink.type === "B") jumpLevel = "Beta";
//     if (jumpLink.type === "G") jumpLevel = "Gamma";
//     if (jumpLink.type === "D") jumpLevel = "Delta";
//     if (jumpLink.type === "E") jumpLevel = "Epsilon";
//
//     originData[0].jumpLinks.push({
//       "destination": destinationName,
//       "jumpLevel": jumpLevel,
//       "discovered": jumpLink.year
//     });
//
//     destinationData[0].jumpLinks.push({
//       "destination": originName,
//       "jumpLevel": jumpLevel,
//       "discovered": jumpLink.year
//     });
//   }
// });
//
// fs.writeFile('../src/app/out.json', JSON.stringify(starSystems), (error) => {
//   if (error) {
//     console.error(error);
//     throw error;
//   }
// });

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
