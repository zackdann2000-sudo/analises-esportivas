import type { LeagueRef, TeamRef } from './types'

const teamLogo = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`
const leagueLogo = (id: number) => `https://media.api-sports.io/football/leagues/${id}.png`
const flag = (code: string) => `https://media.api-sports.io/flags/${code}.svg`

export const LEAGUES: Record<number, LeagueRef> = {
  71: { id: 71, name: 'Brasileirão Série A', country: 'Brasil', logo: leagueLogo(71), flag: flag('br') },
  39: { id: 39, name: 'Premier League', country: 'Inglaterra', logo: leagueLogo(39), flag: flag('gb-eng') },
  140: { id: 140, name: 'La Liga', country: 'Espanha', logo: leagueLogo(140), flag: flag('es') },
  135: { id: 135, name: 'Serie A', country: 'Itália', logo: leagueLogo(135), flag: flag('it') },
  78: { id: 78, name: 'Bundesliga', country: 'Alemanha', logo: leagueLogo(78), flag: flag('de') },
  2: { id: 2, name: 'Champions League', country: 'Europa', logo: leagueLogo(2), flag: null },
}

export const LEAGUE_PRIORITY = [71, 2, 13, 39, 140, 135, 78, 61, 73, 11, 3, 848, 94, 88, 253, 128]

export interface CatalogTeam {
  id: number
  name: string
  short: string
  league: number
  rating: number
  formation: string
  coach: string
  venue: string
  founded: number
  xi: [string, number][]
}

export const TEAMS: CatalogTeam[] = [
  {
    id: 127, name: 'Flamengo', short: 'FLA', league: 71, rating: 84, formation: '4-3-3', coach: 'Filipe Luís', venue: 'Maracanã', founded: 1895,
    xi: [['Rossi', 1], ['Varela', 2], ['Léo Ortiz', 3], ['Léo Pereira', 4], ['Alex Sandro', 26], ['Jorginho', 21], ['Pulgar', 5], ['Arrascaeta', 10], ['Luiz Araújo', 7], ['Pedro', 9], ['Samuel Lino', 16]],
  },
  {
    id: 121, name: 'Palmeiras', short: 'PAL', league: 71, rating: 83, formation: '4-2-3-1', coach: 'Abel Ferreira', venue: 'Allianz Parque', founded: 1914,
    xi: [['Weverton', 21], ['Giay', 4], ['Gustavo Gómez', 15], ['Murilo', 26], ['Piquerez', 22], ['Aníbal Moreno', 5], ['Andreas Pereira', 8], ['Facundo Torres', 17], ['Raphael Veiga', 23], ['Vitor Roque', 9], ['Flaco López', 42]],
  },
  {
    id: 131, name: 'Corinthians', short: 'COR', league: 71, rating: 75, formation: '4-2-3-1', coach: 'Dorival Júnior', venue: 'Neo Química Arena', founded: 1910,
    xi: [['Hugo Souza', 1], ['Matheuzinho', 2], ['Gustavo Henrique', 13], ['André Ramalho', 5], ['Matheus Bidu', 21], ['Raniele', 14], ['José Martínez', 70], ['Breno Bidon', 27], ['Rodrigo Garro', 10], ['Memphis Depay', 94], ['Yuri Alberto', 9]],
  },
  {
    id: 126, name: 'São Paulo', short: 'SAO', league: 71, rating: 76, formation: '4-3-3', coach: 'Hernán Crespo', venue: 'MorumBIS', founded: 1930,
    xi: [['Rafael', 23], ['Cédric', 2], ['Arboleda', 5], ['Alan Franco', 28], ['Enzo Díaz', 13], ['Pablo Maia', 29], ['Marcos Antônio', 30], ['Oscar', 8], ['Lucas Moura', 7], ['Calleri', 9], ['Luciano', 10]],
  },
  {
    id: 120, name: 'Botafogo', short: 'BOT', league: 71, rating: 79, formation: '4-3-3', coach: 'Davide Ancelotti', venue: 'Nilton Santos', founded: 1904,
    xi: [['John', 1], ['Vitinho', 2], ['Barboza', 20], ['David Ricardo', 57], ['Alex Telles', 13], ['Gregore', 26], ['Marlon Freitas', 17], ['Savarino', 10], ['Artur', 7], ['Arthur Cabral', 98], ['Montoro', 11]],
  },
  {
    id: 124, name: 'Fluminense', short: 'FLU', league: 71, rating: 76, formation: '4-2-3-1', coach: 'Luis Zubeldía', venue: 'Maracanã', founded: 1902,
    xi: [['Fábio', 1], ['Samuel Xavier', 2], ['Thiago Silva', 3], ['Ignácio', 4], ['Renê', 6], ['Hércules', 35], ['Martinelli', 8], ['Canobbio', 17], ['Ganso', 10], ['Serna', 90], ['Germán Cano', 14]],
  },
  {
    id: 1062, name: 'Atlético-MG', short: 'CAM', league: 71, rating: 77, formation: '4-3-3', coach: 'Jorge Sampaoli', venue: 'Arena MRV', founded: 1908,
    xi: [['Everson', 22], ['Natanael', 2], ['Lyanco', 4], ['Junior Alonso', 6], ['Guilherme Arana', 13], ['Fausto Vera', 18], ['Gustavo Scarpa', 14], ['Bernard', 11], ['Dudu', 10], ['Hulk', 7], ['Rony', 33]],
  },
  {
    id: 135, name: 'Cruzeiro', short: 'CRU', league: 71, rating: 78, formation: '4-2-3-1', coach: 'Leonardo Jardim', venue: 'Mineirão', founded: 1921,
    xi: [['Cássio', 1], ['William', 12], ['Fabrício Bruno', 15], ['Villalba', 25], ['Kaiki', 6], ['Lucas Romero', 29], ['Christian', 88], ['Wanderson', 11], ['Matheus Pereira', 10], ['Matheus Henrique', 8], ['Kaio Jorge', 19]],
  },
  {
    id: 130, name: 'Grêmio', short: 'GRE', league: 71, rating: 73, formation: '4-2-3-1', coach: 'Mano Menezes', venue: 'Arena do Grêmio', founded: 1903,
    xi: [['Tiago Volpi', 1], ['João Lucas', 2], ['Kannemann', 4], ['Jemerson', 3], ['Marlon', 6], ['Villasanti', 20], ['Dodi', 17], ['Amuzu', 11], ['Cristaldo', 10], ['Edenilson', 8], ['Braithwaite', 22]],
  },
  {
    id: 119, name: 'Internacional', short: 'INT', league: 71, rating: 76, formation: '4-2-3-1', coach: 'Roger Machado', venue: 'Beira-Rio', founded: 1909,
    xi: [['Rochet', 1], ['Aguirre', 2], ['Vitão', 4], ['Juninho', 3], ['Bernabei', 26], ['Thiago Maia', 29], ['Bruno Henrique', 8], ['Wesley', 21], ['Alan Patrick', 10], ['Valencia', 13], ['Borré', 19]],
  },
  {
    id: 133, name: 'Vasco da Gama', short: 'VAS', league: 71, rating: 73, formation: '4-3-3', coach: 'Fernando Diniz', venue: 'São Januário', founded: 1898,
    xi: [['Léo Jardim', 1], ['Paulo Henrique', 96], ['Lucas Freitas', 43], ['Robert Renan', 4], ['Lucas Piton', 6], ['Hugo Moura', 25], ['Tchê Tchê', 3], ['Philippe Coutinho', 11], ['Nuno Moreira', 17], ['Vegetti', 99], ['Rayan', 77]],
  },
  {
    id: 118, name: 'Bahia', short: 'BAH', league: 71, rating: 74, formation: '4-3-3', coach: 'Rogério Ceni', venue: 'Arena Fonte Nova', founded: 1931,
    xi: [['Marcos Felipe', 22], ['Gilberto', 2], ['Kanu', 4], ['David Duarte', 3], ['Luciano Juba', 46], ['Caio Alexandre', 19], ['Jean Lucas', 6], ['Everton Ribeiro', 10], ['Erick Pulga', 16], ['Willian José', 12], ['Ademir', 7]],
  },
  {
    id: 50, name: 'Manchester City', short: 'MCI', league: 39, rating: 87, formation: '4-3-3', coach: 'Pep Guardiola', venue: 'Etihad Stadium', founded: 1880,
    xi: [['Donnarumma', 25], ['Matheus Nunes', 27], ['Rúben Dias', 3], ['Gvardiol', 24], ["Nico O'Reilly", 33], ['Rodri', 16], ['Reijnders', 4], ['Bernardo Silva', 20], ['Foden', 47], ['Haaland', 9], ['Doku', 11]],
  },
  {
    id: 42, name: 'Arsenal', short: 'ARS', league: 39, rating: 89, formation: '4-3-3', coach: 'Mikel Arteta', venue: 'Emirates Stadium', founded: 1886,
    xi: [['Raya', 1], ['Timber', 12], ['Saliba', 2], ['Gabriel', 6], ['Calafiori', 33], ['Rice', 41], ['Zubimendi', 36], ['Ødegaard', 8], ['Saka', 7], ['Gyökeres', 14], ['Martinelli', 11]],
  },
  {
    id: 40, name: 'Liverpool', short: 'LIV', league: 39, rating: 88, formation: '4-2-3-1', coach: 'Arne Slot', venue: 'Anfield', founded: 1892,
    xi: [['Alisson', 1], ['Frimpong', 30], ['Konaté', 5], ['Van Dijk', 4], ['Kerkez', 6], ['Gravenberch', 38], ['Mac Allister', 10], ['Salah', 11], ['Wirtz', 7], ['Gakpo', 18], ['Isak', 9]],
  },
  {
    id: 49, name: 'Chelsea', short: 'CHE', league: 39, rating: 85, formation: '4-2-3-1', coach: 'Enzo Maresca', venue: 'Stamford Bridge', founded: 1905,
    xi: [['Robert Sánchez', 1], ['Reece James', 24], ['Fofana', 29], ['Colwill', 6], ['Cucurella', 3], ['Caicedo', 25], ['Enzo Fernández', 8], ['Estêvão', 41], ['Cole Palmer', 10], ['Pedro Neto', 7], ['João Pedro', 20]],
  },
  {
    id: 33, name: 'Manchester United', short: 'MUN', league: 39, rating: 79, formation: '3-4-2-1', coach: 'Rúben Amorim', venue: 'Old Trafford', founded: 1878,
    xi: [['Lammens', 31], ['Yoro', 15], ['De Ligt', 4], ['Lisandro Martínez', 6], ['Amad', 16], ['Casemiro', 18], ['Bruno Fernandes', 8], ['Dalot', 2], ['Mbeumo', 19], ['Cunha', 10], ['Šeško', 30]],
  },
  {
    id: 47, name: 'Tottenham', short: 'TOT', league: 39, rating: 80, formation: '4-3-3', coach: 'Thomas Frank', venue: 'Tottenham Hotspur Stadium', founded: 1882,
    xi: [['Vicario', 1], ['Pedro Porro', 23], ['Romero', 17], ['Van de Ven', 37], ['Udogie', 13], ['Bentancur', 30], ['Pape Sarr', 29], ['Xavi Simons', 7], ['Kudus', 20], ['Solanke', 19], ['Richarlison', 9]],
  },
  {
    id: 541, name: 'Real Madrid', short: 'RMA', league: 140, rating: 90, formation: '4-3-3', coach: 'Xabi Alonso', venue: 'Santiago Bernabéu', founded: 1902,
    xi: [['Courtois', 1], ['Alexander-Arnold', 12], ['Militão', 3], ['Huijsen', 24], ['Carreras', 18], ['Tchouaméni', 14], ['Valverde', 8], ['Bellingham', 5], ['Arda Güler', 15], ['Mbappé', 10], ['Vinícius Jr.', 7]],
  },
  {
    id: 529, name: 'Barcelona', short: 'BAR', league: 140, rating: 90, formation: '4-2-3-1', coach: 'Hansi Flick', venue: 'Camp Nou', founded: 1899,
    xi: [['Joan García', 13], ['Koundé', 23], ['Cubarsí', 5], ['Eric García', 24], ['Balde', 3], ['Pedri', 8], ['Frenkie de Jong', 21], ['Lamine Yamal', 10], ['Fermín López', 16], ['Raphinha', 11], ['Lewandowski', 9]],
  },
  {
    id: 530, name: 'Atlético de Madrid', short: 'ATM', league: 140, rating: 85, formation: '4-4-2', coach: 'Diego Simeone', venue: 'Metropolitano', founded: 1903,
    xi: [['Oblak', 13], ['Llorente', 14], ['Le Normand', 24], ['Hancko', 17], ['Ruggeri', 3], ['Giuliano Simeone', 20], ['Koke', 6], ['Barrios', 8], ['Álex Baena', 10], ['Julián Álvarez', 19], ['Sørloth', 9]],
  },
  {
    id: 531, name: 'Athletic Bilbao', short: 'ATH', league: 140, rating: 80, formation: '4-2-3-1', coach: 'Ernesto Valverde', venue: 'San Mamés', founded: 1898,
    xi: [['Unai Simón', 1], ['De Marcos', 18], ['Vivian', 3], ['Paredes', 4], ['Yuri Berchiche', 17], ['Jauregizar', 30], ['Ruiz de Galarreta', 16], ['Iñaki Williams', 9], ['Sancet', 8], ['Nico Williams', 10], ['Guruzeta', 12]],
  },
  {
    id: 505, name: 'Inter de Milão', short: 'INT', league: 135, rating: 87, formation: '3-5-2', coach: 'Cristian Chivu', venue: 'San Siro', founded: 1908,
    xi: [['Sommer', 1], ['Pavard', 28], ['Acerbi', 15], ['Bastoni', 95], ['Dumfries', 2], ['Barella', 23], ['Çalhanoğlu', 20], ['Mkhitaryan', 22], ['Dimarco', 32], ['Thuram', 9], ['Lautaro Martínez', 10]],
  },
  {
    id: 489, name: 'Milan', short: 'MIL', league: 135, rating: 83, formation: '3-5-2', coach: 'Massimiliano Allegri', venue: 'San Siro', founded: 1899,
    xi: [['Maignan', 16], ['Tomori', 23], ['Gabbia', 46], ['Pavlović', 31], ['Saelemaekers', 56], ['Youssouf Fofana', 19], ['Modrić', 14], ['Rabiot', 12], ['Estupiñán', 2], ['Pulisic', 11], ['Leão', 10]],
  },
  {
    id: 496, name: 'Juventus', short: 'JUV', league: 135, rating: 82, formation: '3-4-2-1', coach: 'Igor Tudor', venue: 'Allianz Stadium', founded: 1897,
    xi: [['Di Gregorio', 29], ['Kalulu', 15], ['Bremer', 3], ['Gatti', 4], ['Cambiaso', 27], ['Locatelli', 5], ['Khéphren Thuram', 19], ['Kostić', 11], ['Conceição', 7], ['Yıldız', 10], ['Vlahović', 9]],
  },
  {
    id: 492, name: 'Napoli', short: 'NAP', league: 135, rating: 85, formation: '4-3-3', coach: 'Antonio Conte', venue: 'Diego Armando Maradona', founded: 1926,
    xi: [['Meret', 1], ['Di Lorenzo', 22], ['Rrahmani', 13], ['Buongiorno', 4], ['Spinazzola', 37], ['Anguissa', 99], ['Lobotka', 68], ['McTominay', 8], ['Politano', 21], ['Højlund', 19], ['De Bruyne', 11]],
  },
  {
    id: 497, name: 'Roma', short: 'ROM', league: 135, rating: 81, formation: '3-4-2-1', coach: 'Gian Piero Gasperini', venue: 'Stadio Olimpico', founded: 1927,
    xi: [['Svilar', 99], ['Mancini', 23], ['Ndicka', 5], ['Hermoso', 22], ['Wesley', 43], ['Koné', 17], ['Cristante', 4], ['Angeliño', 3], ['Soulé', 18], ['Dybala', 21], ['Dovbyk', 11]],
  },
  {
    id: 499, name: 'Atalanta', short: 'ATA', league: 135, rating: 81, formation: '3-4-2-1', coach: 'Ivan Jurić', venue: 'Gewiss Stadium', founded: 1907,
    xi: [['Carnesecchi', 29], ['Kossounou', 3], ['Hien', 4], ['Djimsiti', 19], ['Bellanova', 16], ['De Roon', 15], ['Ederson', 13], ['Zappacosta', 77], ['De Ketelaere', 17], ['Lookman', 11], ['Krstović', 90]],
  },
  {
    id: 157, name: 'Bayern de Munique', short: 'BAY', league: 78, rating: 90, formation: '4-2-3-1', coach: 'Vincent Kompany', venue: 'Allianz Arena', founded: 1900,
    xi: [['Neuer', 1], ['Laimer', 27], ['Upamecano', 2], ['Tah', 4], ['Davies', 19], ['Kimmich', 6], ['Goretzka', 8], ['Olise', 17], ['Musiala', 42], ['Luis Díaz', 14], ['Harry Kane', 9]],
  },
  {
    id: 165, name: 'Borussia Dortmund', short: 'BVB', league: 78, rating: 83, formation: '3-4-2-1', coach: 'Niko Kovač', venue: 'Signal Iduna Park', founded: 1909,
    xi: [['Kobel', 1], ['Anton', 3], ['Schlotterbeck', 4], ['Bensebaini', 5], ['Ryerson', 26], ['Nmecha', 8], ['Groß', 13], ['Svensson', 24], ['Brandt', 10], ['Adeyemi', 27], ['Guirassy', 9]],
  },
  {
    id: 168, name: 'Bayer Leverkusen', short: 'B04', league: 78, rating: 82, formation: '3-4-2-1', coach: 'Kasper Hjulmand', venue: 'BayArena', founded: 1904,
    xi: [['Flekken', 1], ['Tapsoba', 12], ['Quansah', 4], ['Badé', 5], ['Arthur', 13], ['Andrich', 8], ['Aleix García', 24], ['Grimaldo', 20], ['Tillman', 10], ['Hofmann', 7], ['Schick', 14]],
  },
  {
    id: 173, name: 'RB Leipzig', short: 'RBL', league: 78, rating: 80, formation: '4-2-3-1', coach: 'Ole Werner', venue: 'Red Bull Arena', founded: 2009,
    xi: [['Gulácsi', 1], ['Geertruida', 3], ['Orbán', 4], ['Lukeba', 23], ['Raum', 22], ['Seiwald', 13], ['Schlager', 24], ['Diomande', 49], ['Baumgartner', 14], ['Nusa', 7], ['Rômulo', 40]],
  },
]

export const TEAMS_BY_ID = new Map(TEAMS.map((t) => [t.id, t]))

export function toTeamRef(t: CatalogTeam): TeamRef {
  return { id: t.id, name: t.name, short: t.short, logo: teamLogo(t.id) }
}

export { teamLogo }
