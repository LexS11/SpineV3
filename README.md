Project for tracing out galaxy filaments, initially used for mapping out the spine between the galaxy cluster of Abell 3395 and the MCXC cluster below it

Use eRosita to identify the ra and dec values of galaxies then input them, designing however many groupings of galaxies to act as one "cluster point"
Same can work using CalTECH Gaia if you would like to run this program with stars

Increasing the amount of start and endpoints will increase the amount of lines drawn, creating more points that can be used for a csv

No redshift parameter required becasue it should already filtered to a smaller range before using the program

Uses voronoi tessellations and delaunay triangulation, as well as the A* and shoelace algorithms

Begins with creating a voronoi tessellation around each of the points in order to create a "density" field
There is a relatively normal distribution of mass/dark matter (at least for the system I have been working with) so smaller area means more density
Trianguation between the points to create "roads" which will be traced across using the A* algorithm
Uses Shoelace algorithm to calculate the area of each of the tessellations
Uses A* to calculate an initial path it believes it should take, with account of the net distance and relative shortest path
"Punishes" the A* algorithm for making jumps too large or going to tessellations that are above a certain value, with adjustable parameters to fit your needs

TESTED WITH THE 2174 FILAMENT
