const BASE_IMG_URL = 'https://app.germanbeachtour.de/players/img/scale/';

export enum Gender {
	Male,
	Female
}

export class Player {
	id: number;
	firstName: string;
	lastName: string;
	imgurl: string;
	coins: number;
	points: number;
	position: string;
	gender: Gender;
	gamesPlayed?: number;
	wins?: number;

	constructor(
		gender: Gender,
		firstName: string,
		lastName: string,
		coins: number
	) {

		this.gender = gender;
		this.firstName = firstName;
		this.lastName = lastName;
		this.imgurl = BASE_IMG_URL + this.firstName + '-' + this.lastName + '-Rot.png';

		this.coins = coins;
		this.points = 0;
		this.position = 'Defender';

		this.id = -1;
	}
}
