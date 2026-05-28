# Command: /project:merge-prod

To create new branch based on the changes and merge the code in productization branch.

- create branch based on the changes from productization branch.
- commit, push the changes.

Before merging to productization branch perform below actions.

- Run lint
- Run type-check
- Run build
- Validate env variables
- Check MongoDB connection
- Verify API routes
- Check responsive layouts

Once all done and we are good to go then merge to productization branch.
