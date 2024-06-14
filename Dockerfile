##################################################################
##
## Multi-stage Dockerfile for building the Koans API service
##
##  Commentary: Multistage builds reduce the number of layers and
##              can help with security & size by limiting the
##              the number of unnecessary files included in the
##              final build product.
##
##################################################################

# NodeJS 22 build stage
# It is nice to use slim images where possible, even for build stages
# since this reduces the amount of resource consumption for the build
# pipelines, but this is just one relatively minor consideration in
# choosing the correct base image for our build stage.
FROM node:22.3.0-bookworm-slim AS build
WORKDIR /app

# Our dependencies will not change frequently but our source code will
# so by defering our source code to a future layer we give Docker the
# opportunity to cache our dependencies, which can improve iteration time
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Now we install our source code & build our app
COPY . /app
RUN npm build

# There is an active and probably never-ending debate about what is 
# the correct choice of runtime image.
#
# Some prefer Alpine since it has the lowest number of CVE's but the
# downside of Alpine is often worse performance & suffers from 
# compatibility issues due to being a less-standard linux distro.
#
# Some prefer "distroless" since it uses a more standard linux distro
# as the kernel & contains the minimal number of files. This does reduce
# the overall image size, even compared to Alpine, but image size isn't
# really a concern. 
#
# Despite having more CVE's than Alpine, I default to distroless since it 
# has an overall smaller attack surface & since Alpine relies on musl which 
# can have an impact on performance.
#
# The downside of distroless is that it can become more complex to work
# with for less experienced developers.
#
# Many prefer ubuntu-based images over debian-based images since ubuntu
# is generally better at fixing vulnerabilities.
#
# Of course these is never a single "correct" answer here and the needs
# of the project & the team can change everything, and the preferred
# base image is a moving target anyway as the ecosystem evolves.
FROM gcr.io/distroless/nodejs22-debian12:nonroot
COPY --from=build /app /app
WORKDIR /app
CMD ["server"]