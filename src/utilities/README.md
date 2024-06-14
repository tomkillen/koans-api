# utilities

Here we can store more complex supporting functionality that is not an external dependency, but we want to effectively treat it as external to this project.

These utilities exist outside of the broader architecture of the project and might be consumed by separate component parts of the project.

e.g. the `logger` utility is a good example since this could be consumed anywhere and is used exactly as though it is an external dependency, and indeed it's the kind of functionality where we would very likely prefer to use some standard, well-maintained & opensource, 3rd party utility instead.
