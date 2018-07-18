# Drone Tracker

An application that tracks drones in real time, displaying their location via a single page web app. The complete application is actually a collection of three microservices:

drone-socket: The sole purpose of this application is to listen for incoming location updates from drones, then record the update in redis, publishing a notification via redis that the other services can subsrcibe to.
Calculates the speed of a drone if a previous location has been recorded.

drone-simulator: This service creates simulated drones and sends updates about their location to drone-socket. Runs a periodic task to simulate movement of the drones, sending new location updates to drone-socket.

drone-web: A single page web app that displays the location of the drones in real time. Visually highlights any drone that has been inactive for more than ten seconds. Allows simulated drones to be created, paused, restarted and deleted.

In addition, there is a fourth service called e2e-test, which is used to run end-to-end tests via selenium.


## Getting Started

From the root of the project, run the following command to start a working version of the full application:

docker-compose up --build

Navigate to http://localhost/, or wherever you have it hosted, to view the app.


### Prerequisites

Make sure you have docker and docker compose installed. 


## Testing

To run the full suite of unit tests, enter the following command from the root of the project:

docker-compose -f docker-compose.test.yml --build


To run the end-to-end tests, enter the following command from the root of the project:

docker-compose -f docker-compose.e2e.test.yml --build


Testing output will be displayed in the terminal.


## Coding Style

The project comes with shared git hooks (shared via husky). Prettier and ESLint will be run on all js files on precommit. ESLint is configured to use the Standard rules.


## Assumptions & Deisgn Decisions

Further information is available in assumptions.txt, in the root of the project folder


## Authors

* **Tom Watt** - [tom.watt@protonmail.com]



