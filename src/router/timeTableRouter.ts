import express, {Request, Response} from 'express';
import winston from 'winston';

import {Lesson, TimeTable, Course} from '../classes/timeTable';

const logger = winston.loggers.get('main');
export let router = express.Router();
/**
 * Checks if base permission for all sub functions is given
 */
router.use((req, res, next) =>{
    if(req.decoded.permissions.timeTable){
        next();
        return;
    }
    logger.log({
        level: 'notice',
        label: 'Privileges violation',
        message: `Path: ${req.path} By UserId ${req.decoded.userId}`
    });
    return res.sendStatus(401);
});


/**
 * Adds Lessons
 * @route POST /timetable/lessons
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @param {Lesson.model} Lesson.body.required
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.post('/lessons', async function (req,res){
    if(!req.decoded.permissions.timeTableAdmin){
        //TODO add logger
        return res.sendStatus(401);
    }

    let body = req.body;
    for(let i = 0; i < body.length; i++){
        let lessonDataSet = body[i];
        try {
            let course: Course | undefined = undefined;
            try {
                course = await TimeTable.getCourseByFields(lessonDataSet["subject"], lessonDataSet["grade"], lessonDataSet["group"]);
            } catch (e) {
                console.log(e)
            }
            if(course == undefined){
                course = await TimeTable.addCourse(new Course(lessonDataSet["grade"], lessonDataSet["subject"], lessonDataSet["group"]))
            }
            console.log(course)
            let lesson: Lesson = new Lesson(course,lessonDataSet["lesson"], lessonDataSet["day"], lessonDataSet["room"], null);
            try {
                await TimeTable.addLesson(lesson);
            }catch (e) {
                console.log("AE: "+ JSON.stringify(lesson));
            }

        } catch(e){
            console.log(e);
            //TODO add logger
        }
    }
    res.sendStatus(200);
});

/**
 * Adds Lessons
 * @route POST /timetable/find/course
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @param {Course.model} Course.body.required
 * @returns {Array.<Course>} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.post('/find/course', async (req: Request, res: Response) => {
    try{
        let courses = await TimeTable.getCourseByTeacherDayLesson(req.body["teacher"], req.body["weekday"], req.body["lesson"]);

        res.json(courses);
    }catch(e){
        //TODO add logger
        res.sendStatus(500);
    }
});

/**
 * Returns all available grades
 * @route GET /timetable/grades
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {Array.<Grade>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/grades', async function (req,res){
    //TODO implement
});

/**
 * Returns all available courses
 * @route GET /timetable/courses
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {Array.<Course>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/courses', async function (req,res){
    res.json(await TimeTable.getAllCourses())
});

/**
 * Returns all available lessons
 * @route GET /timetable/lessons
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {Array.<Lesson>} 200
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/lessons', async function (req,res){
    res.json(await TimeTable.getAllLessons());
});

/**
 * Rebuild of all internal lists
 * @route GET /timetable/rebuild
 * @group TimeTable - Functions for Management of Courses, Grades, Lessons
 * @returns {object} 200 - Success
 * @returns {Error} 401 - Wrong Creds
 * @security JWT
 */
router.get('/rebuild', async (req: Request, res: Response) => {
    await TimeTable.rebuildCourseList();
    res.sendStatus(200);
});