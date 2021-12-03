# Board Game Star

Board Game Star is a platform for playing digital boardgames online with a focus on user expierience over simulation.

## Supported Games

| Name        | Implementation  |
| ----------- | --------------- |
| Arboretum   | Aviary          |
| Checkers    | (unimplemented) |
| Chess       | (unimplemented) |
| Condottiere | (unimplemented) |

## Target Games

| Name                | Features Needed                        |
| ------------------- | -------------------------------------- |
| Azul                | Play card face up                      |
| Concordia           | Play card face up                      |
| Jaipur              | Play card face up                      |
| Brass: Birmingham   | Stacks, Player board setup             |
| Inis                | Group Select, Pass To Player           |
| Istanbul            | Stacks                                 |
| Mysterium           | Mass Import                            |
| Undaunted: Normandy | Peek Deck, Remove From Game, Flip Card |

## Run From Source

```bash
npx husky install
yarn install -g foreman
yarn install

# run electron
yarn run start

# run web interface
yarn run start:web
```

## Road Map

- Implement more controls
- Implement more games / templates
- Make game import faster

## FAQ / Help

**It doesn't work for me**

You might have networking issues related to PeerJS
