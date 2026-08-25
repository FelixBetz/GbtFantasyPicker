const BASE_IMG_URL = 'https://app.germanbeachtour.de/players/img/scale/';

export enum Gender {
	Male,
	Female
}

export class Player {
	static #nextId = 0;

	id: number;
	firstName: string;
	lastName: string;
	imgurl: string;
	coins: number;
	points: number;
	position: string;
	gender: Gender;
	licenseNumber: number | null;
	// DVV's team.php id for this player's real-world beach volleyball duo (shared by
	// both partners) - used for e.g. linking to teamhead2head.php between two teams.
	dvvTeamId: number | null;
	gamesPlayed?: number;
	wins?: number;

	constructor(
		gender: Gender,
		firstName: string,
		lastName: string,
		coins: number,
		licenseNumber: number | null = null,
		dvvTeamId: number | null = null
	) {

		this.gender = gender;
		this.firstName = firstName;
		this.lastName = lastName;
		this.imgurl =
			BASE_IMG_URL +
			encodeURIComponent(this.firstName) +
			'-' +
			encodeURIComponent(this.lastName) +
			'-Rot.png';

		this.coins = coins;
		this.points = 0;
		this.position = 'Defender';
		this.licenseNumber = licenseNumber;
		this.dvvTeamId = dvvTeamId;
		this.id = Player.#nextId++;
	}
}
