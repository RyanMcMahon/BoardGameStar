# Board Game Star

Board Game Star is a platform for playing digital boardgames online with a focus on user expierience over simulation.

## Supported Games

| Name        | Implementation  |
| ----------- | --------------- |
| Arboretum   | Aviary          |
| Checkers    | (unimplemented) |
| Chess       | (unimplemented) |
| Condotierre | (unimplemented) |

## Target Games

| Name                | Features Needed                        |
| ------------------- | -------------------------------------- |
| Azul                | Play card face up                      |
| Concordia           | Play card face up                      |
| Jaipur              | Play card face up                      |
| Brass: Birmingham   | Stacks, Player board setup             |
| Inis                | Group Select, Rotate, Pass To Player   |
| Istanbul            | Stacks                                 |
| Mysterium           | Mass Import                            |
| Undaunted: Normandy | Peek Deck, Remove From Game, Flip Card |

## Controls

| Board Actions | Command | Implemented |
| ------------- | ------- | ----------- |
| Move Viewport | Drag    | &#9745;     |
| Zoom In / Out | Scroll  | &#9745;     |

| Piece Actions                                      | Command              | Implemented |
| -------------------------------------------------- | -------------------- | ----------- |
| Select Piece                                       | Click                | -           |
| Select Multiple Pieces                             | Shift + Click        | -           |
| Group Select Pieces                                | Ctrl + Click -> Drag | -           |
| Move Piece                                         | Drag                 | &#9745;     |
| Flip Piece (Selected Card or Token)                | F                    | -           |
| Rotate Piece (Selected Card or Token) Left / Right | Q / E                | -           |
| Remove From Table                                  | -                    | -           |

| Deck Actions           | Command                     | Implemented |
| ---------------------- | --------------------------- | ----------- |
| Menu                   | Right-Click                 | &#9745;     |
| Draw Card(s) Into Hand | Double Click -> Enter Count | &#9745;     |
| Draw Card Face Up      | -                           | -           |
| Draw Card Face Down    | -                           | -           |
| View Deck              | -                           | -           |
| View Discarded         | -                           | -           |

| Stack Actions       | Command | Implemented |
| ------------------- | ------- | ----------- |
| Drag Top            | -       | -           |
| Drag All But Bottom | -       | -           |

## Run From Source

```bash
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
- Mobile interface

## FAQ / Help

**It doesn't work for me**

You might have networking issues related to PeerJS
