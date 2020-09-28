# Voxelarium.js

### Dependancies  

 - [sack.vfs](https://npmjs.com/package/sack.vfs)
 - Uses three.js, includes prebuilt version (101?)


```
git clone https://github.com/d3x0r/Voxelarium.js
cd Voxelarium.js
npm install 
npm start
```
Should report that it is serving on port 8080.

Connect with a browser to localhost:8080.


## Serverless Demo

 - [Intro Page](https://d3x0r.github.io/Voxelarium.js/index.html) - Just a quick test of dynamic text entry, mouseover selection... 
 - [Sector Editor](https://d3x0r.github.io/Voxelarium.js/index2.html) - Edits a single sector... 

### Demo Controls

While the introduction page is prompting for a name, all keys are forwarded to a background text entry field, which is used to get the value to display.  Once the `Enter` key has been presed
the keys are free to be used for navigation.

|Key|Action|
|---|---|
| I | Show/Hide Inventory page - allows selcting a voxel to output in edit mode; some voxel types are actually transparent, and transparent rendering is not enabled.  (water, lava, slime....) |
| W | Forward |
| S | Backward | 
| A | Left |
| D | Right |
| C | Down (Crouch)|
|Space | Up (Jump)|
|Tab| Toggle between mouse lock mode, which also enables WSAD keys which allows looking around, moving, and Edit mode which allows Inventory selection and deleting/setting voxels. |



## Other resources

I'm not really here much...

[![Join the chat at https://gitter.im/d3x0r/Voxelarium.js](https://badges.gitter.im/d3x0r/Voxelarium.js.svg)](https://gitter.im/d3x0r/Voxelarium.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Game inspired by/based on Blackvoxel; in javascript




To launch load index.html


# Game Idea 1.0

1) person.
  a) person needs things.
  b) person can do things.
  
2) environment
  a) water
  b) soil
  c) plants
  d) rock
  ** These start needing processes....
  e) metal
    A) iron - heavy medium structure
    B) copper 
    C) aluminum - light weak structure
    D) titanium - light strong structure
    E) lead - (battery)
    F) 
    I) shape
    I) stamp
    I) cast/mold
    I) extrude

  f) energy
    A) coal
    B) oil
    C) solar
    C) Nuclear

  ** these are purely processes....  
  f) insulator (from organics; rubber plant)
  g) 
